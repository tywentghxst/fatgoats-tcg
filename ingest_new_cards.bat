@echo off
title FatGoats TCG - Card Ingest Engine
color 0B
echo =========================================================
echo       FATGOATS TCG - AUTOMATIC CARD INGESTION
echo =========================================================
echo.
echo Scanning folder: NEW CARDS\
echo Processing images, generating WebP thumbnails, and 
echo registering cards into cardsData.ts and questsData.ts...
echo.

python scripts\ingest_cards.py

echo.
echo =========================================================
echo Ingestion process completed! Press any key to close.
echo =========================================================
pause >nul
