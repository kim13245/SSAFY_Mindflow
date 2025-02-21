import os
import queue
import signal
import subprocess
import sys
import threading
import time


class CommandExecutor:
    def __init__(self):
        self.output_queue = queue.Queue()
        self.is_running = True
        self.processes = []
        self.executed_commands = set()  # Track executed commands
        self.docker_started = False  # Track Docker startup

    def run_command(self, command, shell_type="cmd", cwd=None):
        try:
            # Check if command was already executed
            if command in self.executed_commands:
                print(f"Command already executed: {command}")
                return None

            if shell_type == "git-bash":
                git_bash_path = r"C:\Program Files\Git\bin\bash.exe"
                full_command = [git_bash_path, "-c", command]
            else:
                full_command = command

            process = subprocess.Popen(full_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                shell=(shell_type == "cmd"), cwd=cwd, text=True, encoding='utf-8', errors='replace',
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)

            self.processes.append(process)
            self.executed_commands.add(command)  # Mark command as executed

            def read_output(pipe, queue, prefix):
                try:
                    while True:
                        line = pipe.readline()
                        if not line and process.poll() is not None:
                            break
                        if line and self.is_running:
                            queue.put(f"{prefix}: {line.strip()}")
                finally:
                    pipe.close()

            threading.Thread(target=read_output, args=(process.stdout, self.output_queue, "OUTPUT"),
                             daemon=True).start()
            threading.Thread(target=read_output, args=(process.stderr, self.output_queue, "ERROR"), daemon=True).start()

            return process

        except Exception as e:
            self.output_queue.put(f"Failed to execute command: {command}")
            self.output_queue.put(f"Error: {str(e)}")
            return None

    def cleanup(self):
        """Cleanup all running processes"""
        self.is_running = False
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception as e:
                print(f"Error cleaning up process: {e}")

    def output_monitor(self):
        while self.is_running:
            try:
                message = self.output_queue.get(timeout=1)
                print(message, flush=True)
            except queue.Empty:
                continue
            except Exception:
                break

    def start_docker_if_needed(self):
        """Start Docker Desktop if not already started"""
        if not self.docker_started:
            docker_path = r"C:\Program Files\Docker\Docker\Docker Desktop.exe"
            if os.path.exists(docker_path):
                subprocess.Popen([docker_path])
                print("Starting Docker Desktop...")
                time.sleep(20)  # Wait for Docker to start
                self.docker_started = True


def run_git_bash_tasks(executor, git_bash_commands):
    """Function to run Git Bash commands"""
    for cmd in git_bash_commands:
        if not executor.is_running:
            break
        if cmd not in executor.executed_commands:  # Only execute if not already run
            print(f"\n[STARTER] Starting command: {cmd}")
            process = executor.run_command(cmd, shell_type="git-bash")
            if process:
                if "redis" in cmd:
                    print("[STARTER] Waiting for Redis to start...")
                    time.sleep(5)
                elif "celery" in cmd:
                    print("[STARTER] Waiting for Celery to start...")
                    time.sleep(10)
                elif "python ASD.py" in cmd:
                    print("[STARTER] Starting Flask application...")
            time.sleep(2)  # Brief pause between starting commands


def signal_handler(signum, frame):
    """Signal handler for graceful shutdown"""
    print("\nSignal received. Starting graceful shutdown...")
    raise KeyboardInterrupt


def main():
    # Set up signal handling
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Initialize command executor
    executor = CommandExecutor()

    try:
        # Start Docker Desktop if needed (now using the tracked method)
        executor.start_docker_if_needed()

        # Start output monitor thread
        monitor_thread = threading.Thread(target=executor.output_monitor, daemon=True)
        monitor_thread.start()

        # First set of commands
        git_bash_commands = ["docker start redis", "celery -A tasks worker --pool=solo -l info", ]
        git_thread = threading.Thread(target=run_git_bash_tasks, args=(executor, git_bash_commands), daemon=True)
        git_thread.start()
        time.sleep(10)

        # Second set of commands
        git_bash_commands2 = ['python app.py']
        git_thread2 = threading.Thread(target=run_git_bash_tasks, args=(executor, git_bash_commands2), daemon=True)
        git_thread2.start()

        # Keep the main thread alive until interrupted
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nShutdown initiated...", file=sys.stderr)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
    finally:
        # Cleanup
        executor.cleanup()
        time.sleep(1)  # Give threads time to clean up
        print("Shutdown complete.")


if __name__ == "__main__":
    main()
