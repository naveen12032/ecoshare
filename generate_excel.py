import os
import sys
import subprocess

def main():
    print("Redirecting Excel report generation to run live test suite (Jest + Selenium)...")
    # Run the real pipeline
    cmd = "cmd /c \"set PYTHONIOENCODING=utf-8 && python run_e2e.py\""
    res = subprocess.run(cmd, shell=True)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
