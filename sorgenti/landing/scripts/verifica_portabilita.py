"""Riapre una copia isolata del solo .blend e renderizza il monitor.

Python 3, nessuna dipendenza aggiuntiva. La cartella temporanea viene rimossa.
"""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
with tempfile.TemporaryDirectory(prefix='landing-portabilita-') as folder:
    isolated = Path(folder)
    copied = isolated / 'Landing_Completa.blend'
    shutil.copy2(BASE / copied.name, copied)
    (isolated / 'scripts').mkdir()
    checker = isolated / 'scripts/verifica_landing.py'
    shutil.copy2(BASE / 'scripts/verifica_landing.py', checker)
    render_script = isolated / 'render.py'
    render_script.write_text('''import bpy, runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).parent/'scripts/verifica_landing.py'))
sc=bpy.context.scene
sc.camera=bpy.data.objects['02 · landing · dettaglio del monitor']
sc.frame_set(216)
sc.render.resolution_percentage=50
sc.cycles.samples=32
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'; prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='METAL'
    sc.cycles.device='GPU'
except Exception: sc.cycles.device='CPU'
sc.render.filepath=str(Path(__file__).parent/'monitor-portabilita.png')
bpy.ops.render.render(write_still=True)
''')
    completed = subprocess.run([
        BLENDER, '--factory-startup', '--disable-autoexec', '-b', str(copied),
        '--python-exit-code', '1', '--python', str(render_script),
    ], cwd=isolated, capture_output=True, text=True)
    if completed.returncode:
        raise RuntimeError(completed.stdout + completed.stderr)
    report = json.loads((isolated / 'verifica-finale.json').read_text())
    report['solo_file_blend_copiato'] = True
    report['render_da_risorse_incorporate'] = (isolated / 'monitor-portabilita.png').is_file()
    report['passed'] = report['passed'] and report['render_da_risorse_incorporate']
    shutil.copy2(isolated / 'monitor-portabilita.png', BASE / 'anteprime/monitor-portabilita.png')
    (BASE / 'verifica-portabilita.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'passed': report['passed'], 'images': report['images'],
                     'checks': len(report['checks']), 'isolated_path': str(copied)}))
