"""Applica soltanto la taratura finale alla scena già assemblata.

Eseguire in Blender dopo aver aperto Landing_Completa.blend.
Conserva geometrie, materiali, posizioni e regolazione del sole salvate.
"""
from pathlib import Path
import bpy

sc = bpy.context.scene
rig = bpy.data.objects['CTRL LOGO · posizione e animazioni']
for index, power in enumerate([86, 86, 40], 1):
    energy = power * .8 * rig.scale.x ** 2
    bpy.data.objects[f'FARO LOGO · {index}'].data.energy = energy
    bpy.data.objects[f'RIFLESSO · faro {index}'].data.energy = energy
for node in sc.compositing_node_group.nodes:
    if node.label == 'arancio caldo, saturazione controllata':
        node.inputs['Saturation'].default_value = .60
sc.camera = bpy.data.objects['01 · landing · postazione ampia']
sc.frame_set(150)
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.resolution_percentage = 100
sc.render.fps = 24
sc.cycles.samples = 128
sc.render.filepath = '//anteprime/render.png'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
            area.spaces.active.clip_end = 300
sc['taratura_finale'] = '7 ottobre 2026 · arancio e fari del logo'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
print('TARATURA_FINALE_SALVATA', bpy.data.filepath)
