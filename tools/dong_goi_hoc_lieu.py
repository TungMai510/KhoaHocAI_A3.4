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
MOODLE = "https://nhom7ai-hcmue.moodlecloud.com"
H5P_FILE = "Soc_Tham_Tu_Vu_an_AI_nham_lan.h5p"

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
        "hl2_mo_phong.html", "bai1_tong_ket.html", "bai1-hoc-lieu.css",
        "bai1-hoc-lieu.js", "bai1-moodle.js", "bai1-video.js", "app.js", "evidence-model.js",
        "assets/apple.svg", "assets/banana.svg", "assets/can.svg",
        "assets/detective-desk.svg", "assets/milk.svg",
    ),
    2: ("assets/favicon.svg",),
    3: (*LESSON_STYLES, "bai3_y_tuong.html", "lesson3.js", "assets/can.svg"),
    4: (
        *LESSON_STYLES, "bai4_cai_tien.html", "lesson4.js", "assets/can.svg",
        "assets/test-bottle.svg", "assets/test-bottle-side.svg",
        "assets/test-bottle-t3.svg", "assets/test-can-clear.svg",
        "assets/test-can-obscured.svg", "assets/test-group.svg",
    ),
}



LESSON_ONE_SECTIONS = {
    "01. Khởi động": (
        "Xem video 01 rồi vào cuộc điều tra.",
        (("Màn hình khởi động", "../index.html"), ("Video 01", "../bai-1/video/HL01_Khoi_dong.mp4")),
    ),
    "02. Cùng Sóc khám phá AI": (
        "Mở sáu bước theo thứ tự. Dùng Google Dịch và AI for Oceans để quan sát đầu vào và kết quả.",
        (("Cùng Sóc khám phá AI", "../bai1_hoc_lieu.html#h1"), ("Video 02", "../bai-1/video/HL02_Kham_pha.mp4")),
    ),
    "03. Quầy món ngon của Sóc": (
        "Trong Moodle, mở SCORM 66. Gói SCORM dưới đây dùng để nhập vào LMS hỗ trợ SCORM 1.2.",
        (("SCORM 66 trên Moodle", MOODLE + "/mod/scorm/view.php?id=66"),
         ("Gói SCORM 1.2", "Quay_mon_ngon_SCORM12.zip"),
         ("Chơi bản web", "../quay-mon-ngon/index.html?flow=lesson1"),
         ("Video 03", "../bai-1/video/HL03_Quay_mon_ngon.mp4")),
    ),
    "04. Bí ẩn sau ảnh mờ": (
        "Dự đoán chai hay lon, kiểm tra vật chứng ở chế độ 3D hoặc 2D rồi kết luận.",
        (("Bí ẩn sau ảnh mờ", "../hl2_mo_phong.html"), ("Video 04", "../bai-1/video/HL04_Bi_an_anh_mo.mp4")),
    ),
    "05. Tự luyện H5P": (
        "Gói H5P có video và phụ đề tiếng Việt. Mở bằng Lumi hoặc nhập vào Content bank của Moodle để tương tác.",
        (("Mở H5P trên Moodle", MOODLE + "/mod/h5pactivity/view.php?id=81"),
         ("Gói H5P Interactive Video", H5P_FILE)),
    ),
    "06. Tổng kết": (
        "Xem Sóc nhắc lại cách kiểm tra gợi ý của AI rồi chuyển sang đề ôn tập.",
        (("Màn hình tổng kết", "../bai1_tong_ket.html"), ("Video 05", "../bai-1/video/HL05_Tong_ket.mp4")),
    ),
    "07. Đánh giá và chia sẻ": (
        "Các liên kết dẫn tới đúng hoạt động trên Moodle. Học sinh đăng nhập bằng tài khoản khóa học.",
        (("Đề ôn tập", MOODLE + "/mod/quiz/view.php?id=53"),
         ("Phiếu hai ví dụ AI", MOODLE + "/mod/assign/view.php?id=59"),
         ("Nhật ký hai lượt thử", MOODLE + "/mod/assign/view.php?id=60"),
         ("Chia sẻ với bạn", MOODLE + "/mod/forum/view.php?id=62")),
    ),
}


def write_lesson_one_sections(archive):
    for heading, (instruction, links) in LESSON_ONE_SECTIONS.items():
        guide = "<!doctype html><html lang='vi'><meta charset='utf-8'>\n"
        guide += "<meta name='viewport' content='width=device-width, initial-scale=1'>\n"
        guide += f"<title>{heading}</title><main><h1>{heading}</h1><p>{instruction}</p><ul>\n"
        for label, href in links:
            guide += f'<li><a href="{href}">{label}</a></li>\n'
        guide += "</ul></main></html>\n"
        archive.writestr(f"{heading}/index.html", guide)
    archive.write(ROOT / "Moodle/Quay_mon_ngon_SCORM12.zip",
                  "03. Quầy món ngon của Sóc/Quay_mon_ngon_SCORM12.zip")
    archive.write(ROOT / "bai-1/soc-vu-an-ai" / H5P_FILE, "05. Tự luyện H5P/" + H5P_FILE)


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
            if lesson == 1:
                write_lesson_one_sections(archive)
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
    parser.add_argument("--lesson", type=int, choices=LESSON_FILES, help="Export only the selected lesson.")
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        parser.error("Choose an output directory outside the repository.")
    output.mkdir(parents=True, exist_ok=True)
    for lesson in (args.lesson,) if args.lesson else LESSON_FILES:
        print(export_lesson(lesson, output))


if __name__ == "__main__":
    main()
