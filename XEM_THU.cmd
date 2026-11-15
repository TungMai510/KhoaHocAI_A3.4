@echo off
cd /d "%~dp0"
echo.
echo Ban xem thu: http://127.0.0.1:8340/
echo Mo dia chi tren trong trinh duyet. Bam Ctrl+C de dung may chu.
echo.
python -m http.server 8340 --bind 127.0.0.1
pause
