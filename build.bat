@echo off
REM 在 Windows 上打包成單一 exe：產物位於 dist\TarotResizer.exe
python -m pip install -r requirements.txt pyinstaller
pyinstaller --noconfirm --onefile --windowed --name TarotResizer --collect-all tkinterdnd2 tarot_resizer.py
echo.
echo 完成！執行檔：dist\TarotResizer.exe
pause
