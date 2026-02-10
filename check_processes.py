"""
Check if multiple processing tasks are running
"""
import psutil
import sys

print("=== Checking for Multiple Processing Tasks ===\n")

# Get current Python processes
current_pid = psutil.Process().pid
python_processes = []

for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        if 'python' in proc.info['name'].lower():
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            if 'test_direct_process' in cmdline or 'process_video' in cmdline:
                python_processes.append({
                    'pid': proc.info['pid'],
                    'cmdline': cmdline
                })
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

print(f"Found {len(python_processes)} processing task(s):\n")
for proc in python_processes:
    print(f"PID {proc['pid']}: {proc['cmdline']}")

if len(python_processes) > 1:
    print("\n⚠️ WARNING: Multiple processing tasks detected!")
    print("This can cause progress to fluctuate.")
    print("Recommendation: Kill old processes and restart.")
else:
    print("\n✅ Only one processing task running (or none)")
