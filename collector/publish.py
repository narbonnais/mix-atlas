"""Refresh shared runtime assets without writing data or artist rules into JS."""
import subprocess


def prepare_site(root):
    subprocess.run(['node', str(root / 'scripts/prepare.mjs')], cwd=root, check=True)
