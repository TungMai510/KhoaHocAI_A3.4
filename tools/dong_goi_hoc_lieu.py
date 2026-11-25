"""Export four lesson ZIPs from the existing GitHub Pages source tree."""

import argparse
import re
import subprocess
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
PAGES = "https://tungmai510.github.io/KhoaHocAI_A3.4/"
OUTPUT = ROOT.parent / "Tai_lieu_su_pham" / "Hoc_lieu_nop"

SHARED_WEB = (
    "styles.css", "azota-embed.css", "azota-embed.js",
    "assets/favicon.svg", "assets/squirrel.svg",
)
LESSON_STYLES = (*SHARED_WEB, "lesson-styles.css")
SIGNPOSTS = {
    "khoa_hoc.html", "bai3_y_tuong.html", "bai4_cai_tien.html",
}
LESSON_FILES = {
    1: (
        *SHARED_WEB, "index.html", "bai1_hoc_lieu.html", "hl1_kham_pha.html",
        "hl2_mo_phong.html", "hl3_luyen_tap.html", "bai1-hoc-lieu.css",
        "bai1-hoc-lieu.js", "bai1-moodle.js", "app.js", "evidence-model.js",
        "assets/apple.svg", "assets/banana.svg", "assets/can.svg",
        "assets/detective-desk.svg", "assets/milk.svg",
        "Moodle/Quay_mon_ngon_SCORM12.zip",
    ),
    2: ("assets/favicon.svg", "azota-embed.css", "azota-embed.js"),
    3: (*LESSON_STYLES, "bai3_y_tuong.html", "lesson3.js"),
    4: (
        *LESSON_STYLES, "bai4_cai_tien.html", "lesson4.js", "assets/can.svg",
        "assets/test-bottle.svg", "assets/test-bottle-side.svg",
        "assets/test-bottle-t3.svg", "assets/test-can-clear.svg",
        "assets/test-can-obscured.svg", "assets/test-group.svg",
    ),
}


def tracked_tree(prefix):
    output = subprocess.check_output(["git", "ls-files", "-z", "--", prefix], cwd=ROOT)
    return output.decode("utf-8").rstrip("\0").split("\0") if output else []


def read_html(source, filenames):
    # Preserve the on-disk layout and send navigation outside this ZIP to Pages.
    def rewrite(match):
        target = match[1].removeprefix("../")
        if target in SIGNPOSTS and target not in filenames:
            return f'href="{PAGES}{target}"'
        return match[0]

    return re.sub(r'href="((?:\.\./)?[^"/#?]+\.html)"', rewrite,
                  source.read_bytes().decode("utf-8")).encode("utf-8")


def export_lesson(lesson, output):
    lesson_dir = f"bai-{lesson}"
    readme = f"{lesson_dir}/README.md"
    filenames = set(LESSON_FILES[lesson])
    if lesson == 1:
        filenames.update(tracked_tree("quay-mon-ngon/"))
    if lesson == 2:
        filenames.update(f for f in tracked_tree("bai-2/") if not f.endswith(".md"))
    filenames.update(tracked_tree(f"{lesson_dir}/video/"))

    archive_path = output / f"Bai_{lesson}_Hoc_lieu.zip"
    with NamedTemporaryFile(dir=output, delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        with ZipFile(temp_path, "w", ZIP_DEFLATED) as archive:
            archive.write(ROOT / readme, "README.md")
            for filename in sorted(filenames):
                source = ROOT / filename
                if source.suffix.lower() == ".html":
                    archive.writestr(filename, read_html(source, filenames))
                else:
                    archive.write(source, filename)
        temp_path.replace(archive_path)
    finally:
        temp_path.unlink(missing_ok=True)
    return archive_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        parser.error("Choose an output directory outside the repository.")
    output.mkdir(parents=True, exist_ok=True)
    for lesson in LESSON_FILES:
        print(export_lesson(lesson, output))


if __name__ == "__main__":
    main()
