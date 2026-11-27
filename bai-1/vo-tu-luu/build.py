"""Build the Lesson 1 workbook as an independent SCORM 1.2 package."""
import argparse
import re
from pathlib import Path
from shutil import copy2
from xml.etree import ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[1]
COMMON = (
    "styles.css", "bai1-hoc-lieu.css", "bai1-video.js",
    "assets/favicon.svg", "assets/squirrel.svg", "assets/banana.svg",
    "assets/milk.svg", "assets/apple.svg",
    "bai-1/video/HL02_Kham_pha.mp4", "bai-1/video/HL02_Kham_pha.webp",
)
PACKAGE = "Vo_hoc_lieu_Bai_1_SCORM12.zip"
IMS = "http://www.imsproject.org/xsd/imscp_rootv1p1p2"
ADL = "http://www.adlnet.org/xsd/adlcp_rootv1p2"


def workbook():
    original = (ROOT / "bai1_hoc_lieu.html").read_text(encoding="utf-8")
    before_new_steps, marker, _ = original.partition('    <section id="h3"')
    if not marker:
        raise ValueError("Missing H3 boundary in existing workbook")
    page = re.sub(r'  <script src="bai1-(?:moodle|hoc-lieu)\.js[^"]*"[^>]*></script>\n', '', before_new_steps)
    page = re.sub(r'      <button id="lesson-expand"[^\n]+\n', '', page)
    page = re.sub(r'      <details id="shared-device".*?</details>\n', '', page, flags=re.S)
    page = page.replace('<script src="bai1-video.js', '<link rel="stylesheet" href="workbook.css">\n'
                        '<script src="scorm.js" defer></script>\n<script src="lesson.js" defer></script>\n'
                        '<script src="bai1-video.js')
    page += (SOURCE / "steps.html").read_text(encoding="utf-8")
    return page + "  </main>\n</body>\n</html>\n"


def manifest(entries):
    ET.register_namespace("", IMS)
    ET.register_namespace("adlcp", ADL)
    tag = lambda node: "{" + IMS + "}" + node
    manifest = ET.Element(tag("manifest"), identifier="Nhom7-Bai1-Workbook", version="1.0")
    metadata = ET.SubElement(manifest, tag("metadata"))
    ET.SubElement(metadata, tag("schema")).text = "ADL SCORM"
    ET.SubElement(metadata, tag("schemaversion")).text = "1.2"
    orgs = ET.SubElement(manifest, tag("organizations"), default="BAI1")
    org = ET.SubElement(orgs, tag("organization"), identifier="BAI1")
    ET.SubElement(org, tag("title")).text = "Cùng Sóc khám phá AI"
    item = ET.SubElement(org, tag("item"), identifier="WORKBOOK", identifierref="SCO")
    ET.SubElement(item, tag("title")).text = "Vở học liệu Bài 1"
    resources = ET.SubElement(manifest, tag("resources"))
    sco = ET.SubElement(resources, tag("resource"), identifier="SCO", type="webcontent",
                        href="index.html", attrib={"{" + ADL + "}scormtype": "sco"})
    for name in entries:
        ET.SubElement(sco, tag("file"), href=name)
    ET.indent(manifest)
    return ET.tostring(manifest, encoding="utf-8", xml_declaration=True)


def build(output):
    player = output / "sco"
    player.mkdir(parents=True, exist_ok=True)
    for filename in COMMON:
        dest = player / filename
        dest.parent.mkdir(parents=True, exist_ok=True)
        copy2(ROOT / filename, dest)
    runtime = ("scorm.js", "lesson.js", "workbook.css")
    for filename in runtime:
        copy2(SOURCE / filename, player / filename)
    (player / "index.html").write_text(workbook(), encoding="utf-8")
    entries = ("index.html", *runtime, *COMMON)
    (player / "imsmanifest.xml").write_bytes(manifest(entries))
    archive = output / PACKAGE
    with ZipFile(archive, "w", ZIP_DEFLATED) as zip_file:
        for filename in ("imsmanifest.xml", *entries):
            zip_file.write(player / filename, filename)
    with ZipFile(archive) as zip_file:
        if zip_file.testzip() is not None:
            raise ValueError("SCORM archive failed integrity check")
    return archive


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    print(build(parser.parse_args().output.resolve()))
