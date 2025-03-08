@echo off
cd /d "C:\Workspace\m2m-chicken-shop"

:: Start backend in new command prompt
start cmd /k "cd backend && npm start"

:: Start frontend in new command prompt
start cmd /k "cd frontend && npm start"
