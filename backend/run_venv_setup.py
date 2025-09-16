"""
Quick setup script to run model caching within activated venv
"""
import subprocess
import sys
import os

def run_venv_setup():
    """Run the model setup inside the virtual environment"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    setup_script = os.path.join(backend_dir, 'setup_models_venv.py')
    
    if not os.path.exists(venv_python):
        print(f"ERROR: Virtual environment Python not found at {venv_python}")
        return False
        
    if not os.path.exists(setup_script):
        print(f"ERROR: Setup script not found at {setup_script}")
        return False
    
    print(f"Running model setup with virtual environment Python...")
    print(f"Using: {venv_python}")
    
    try:
        # Run the setup script with venv Python
        result = subprocess.run([venv_python, setup_script], 
                               cwd=backend_dir,
                               capture_output=False,  # Show output in real-time
                               text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"ERROR running setup: {e}")
        return False

if __name__ == "__main__":
    success = run_venv_setup()
    sys.exit(0 if success else 1)