"""Verifica risorse, geometrie, driver e animazioni; produce render su richiesta.

Blender --factory-startup --disable-autoexec -b Landing_Completa.blend --python questo.py -- [render]
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

BASE=Path(__file__).resolve().parents[1]
sc=bpy.context.scene
screen_ctrl=bpy.data.objects['CTRL SCHERMO · stato e animazione']
logo_ctrl=bpy.data.objects['CTRL LOGO · posizione e animazioni']
desk=bpy.data.objects['POSTAZIONE · sposta insieme scrivania e Macintosh']
checks={}
checks['render_1920_1080_24fps']=sc.render.resolution_x==1920 and sc.render.resolution_y==1080 and sc.render.fps==24
checks['camera_ampia_attiva']=sc.camera.name=='01 · landing · postazione ampia'

images=[i for i in bpy.data.images if i.users and i.source=='FILE']
checks['tutte_le_immagini_incorporate']=all(i.packed_file for i in images)
checks['atlante_incorporato']=bool(bpy.data.images['schermo-atlante.png'].packed_file)
checks['guida_interna']=bool(bpy.data.texts.get('LEGGIMI · camere, schermo e logo'))
checks['camere']=len([o for o in sc.objects if o.type=='CAMERA'])==6
checks['logo_nove_mesh']=len([o for o in bpy.data.collections['03 · logo e controlli'].objects if o.type=='MESH'])==9
checks['shape_keys']=all('chiusura' in bpy.data.objects[f'{part}_{side}'].data.shape_keys.key_blocks for side in ['sx','dx'] for part in ['palpebra','pupilla'])
checks['azioni_riutilizzabili']=all(bpy.data.actions.get('logo · '+name) for name in ['battito','occhiolino','sorriso','sonno e risveglio','sguardo'])
checks['luce_logo_esclusiva']=all(o.light_linking.receiver_collection is not None for o in sc.objects if o.type=='LIGHT' and o.name.startswith('FARO LOGO'))
checks['sole_esclude_logo']=all(o not in bpy.data.objects['SOLE · fessura arancione'].light_linking.receiver_collection.objects.values() for o in bpy.data.collections['03 · logo e controlli'].objects if o.type=='MESH')

all_desk=[o for o in bpy.data.collections['02 · postazione Macintosh'].objects if o.type=='MESH']
points=[o.matrix_world @ Vector(corner) for o in all_desk for corner in o.bound_box]
z_min=min(p.z for p in points); height=max(p.z for p in points)-z_min
checks['postazione_appoggiata']=abs(z_min)<.002
checks['altezza_originale_3_1']=abs(height-3.1)<.003
screen=bpy.data.objects['CRT · tue interfacce']
mesh=screen.data
checks['schermo_quattro_angoli']=len(mesh.vertices)==4 and len(mesh.polygons)==1
checks['schermo_uv_corrette']={tuple(round(v,2) for v in entry.uv) for entry in mesh.uv_layers[0].data}=={(0.,0.),(1.,0.),(1.,1.),(0.,1.)}

states={1:0,24:1,75:1,134:3,168:4,216:5,264:6,312:7,348:8,384:9,432:3}
frames=[]
for frame,expected in states.items():
    sc.frame_set(frame)
    graph=bpy.context.evaluated_depsgraph_get()
    ctrl=screen_ctrl.evaluated_get(graph)
    actual=round(ctrl['stato'])
    frames.append({'frame':frame,'stato':actual,'tessera':ctrl['tessera_atlante'],'avvio':ctrl['fotogramma_avvio']})
    checks[f'stato_frame_{frame}']=actual==expected
    expected_tile=0 if expected==0 else 1+min(109,max(0,math.floor(ctrl['fotogramma_avvio']))) if expected==1 else {3:111,4:112,5:113,6:114,7:115,8:116,9:117}[expected]
    checks[f'atlante_frame_{frame}']=abs(ctrl['tessera_atlante']-expected_tile)<.01

expressions=[]
for frame in [1,77,114,160,243,291,342]:
    sc.frame_set(frame)
    graph=bpy.context.evaluated_depsgraph_get()
    data={}
    for side in ['sx','dx']:
        mesh_object=bpy.data.objects[f'palpebra_{side}'].evaluated_get(graph)
        data[side]=mesh_object.data.shape_keys.key_blocks['chiusura'].value
    data['sorriso']=bpy.data.objects['sorriso'].evaluated_get(graph).data.shape_keys.key_blocks['sorriso_ampio'].value
    expressions.append({'frame':frame,**data})
checks['battito_chiude_entrambi']=all(expressions[1][side]>.9 for side in ['sx','dx'])
checks['occhiolino_un_occhio']=expressions[2]['dx']>.9 and expressions[2]['sx']<.1
checks['sorriso_anima_bocca']=expressions[3]['sorriso']>.9
checks['sonno_chiude_entrambi']=all(expressions[4][side]>.9 for side in ['sx','dx'])
checks['risveglio_riapre']=all(expressions[5][side]<.05 for side in ['sx','dx'])
invalid=[]
for datablocks in [bpy.data.objects,bpy.data.shape_keys,bpy.data.materials,bpy.data.lights]:
    for block in datablocks:
        owners=[block]
        if hasattr(block,'node_tree') and block.node_tree: owners.append(block.node_tree)
        for owner in owners:
            if owner.animation_data:
                invalid.extend(f'{owner.name}: {fc.data_path}' for fc in owner.animation_data.drivers if not fc.driver.is_valid)
checks['driver_validi_senza_autorun']=not invalid
sc.frame_set(150)
report={'checks':checks,'passed':all(checks.values()),'invalid_drivers':invalid,'images':len(images),'height':height,'floor':z_min,'screen_samples':frames,'expressions':expressions,'reopened_from':bpy.data.filepath}
(BASE/'verifica-finale.json').write_text(json.dumps(report,indent=2)+'\n')
print('VERIFICA',json.dumps(report))
if not report['passed']:
    raise AssertionError([name for name,passed in checks.items() if not passed])

if 'render' in sys.argv or 'render-completo' in sys.argv:
    sc.render.resolution_percentage=100 if 'render-completo' in sys.argv else 50
    sc.cycles.samples=128 if 'render-completo' in sys.argv else 48
    # Le preferenze di processo non vengono salvate nel sistema o nel .blend.
    try:
        prefs=bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type='METAL'; prefs.get_devices()
        for device in prefs.devices: device.use=device.type=='METAL'
        sc.cycles.device='GPU'
    except Exception: sc.cycles.device='CPU'
    for name,frame,filename in [
        ('01 · landing · postazione ampia',150,'postazione-ampia.png'),
        ('02 · landing · dettaglio del monitor',216,'monitor-branding.png'),
        ('03 · landing · vista generale della sala',150,'sala-generale.png'),
    ]:
        sc.camera=bpy.data.objects[name]; sc.frame_set(frame)
        sc.render.filepath=str(BASE/'anteprime'/filename)
        bpy.ops.render.render(write_still=True)
    # Il confronto usa lo stesso formato della schermata di riferimento.
    sc.camera=bpy.data.objects['06 · verifica · postazione 976x1072']
    sc.render.resolution_x=976; sc.render.resolution_y=1072; sc.render.resolution_percentage=100
    sc.frame_set(1)
    # Posa del logo ricomposta esattamente per il formato di confronto.
    monitor_positions=[]
    measures=json.loads((BASE.parents[1]/'src/components/computer/misureComputer.json').read_text())
    for i in range(8):
        p=[measures['monitor']['max' if i & (1<<k) else 'min'][k] for k in range(3)]
        monitor_positions.append(desk.matrix_world @ Vector((p[0],-p[2],p[1])))
    view=sc.camera.matrix_world.inverted(); ps=[view@p for p in monitor_positions]
    tan=math.tan(math.radians(20)); px=[(p.x/-p.z/tan/(976/1072)*.5+.5)*976 for p in ps]; py=[(.5-p.y/-p.z/tan*.5)*1072 for p in ps]
    L=1.25*(max(px)-min(px)); y=max(min(py)-.03*L-((60.6+44.4+6.8-88.44)/247.41)*L,.03*L-((47.85-24.24-88.44)/247.41)*L)
    depth=max(-p.z for p in ps)+.5; units=2*depth*tan/1072
    # La scala relativa si ricava dalla proiezione nella camera larga originale.
    reference_width=L*units
    old_location=logo_ctrl.location.copy(); old_scale=logo_ctrl.scale.copy()
    old_cam=bpy.data.objects['01 · landing · postazione ampia']; old_view=old_cam.matrix_world.inverted(); old_points=[old_view@p for p in monitor_positions]
    old_px=[(p.x/-p.z/tan/(1920/1080)*.5+.5)*1920 for p in old_points]
    old_depth=max(-p.z for p in old_points)+.5
    old_width=1.25*(max(old_px)-min(old_px))*2*old_depth*tan/1080
    logo_ctrl.scale=old_scale*(reference_width/old_width)
    logo_ctrl.location=sc.camera.matrix_world @ Vector((((min(px)+max(px))/2-488)*units,-(y-536)*units,-depth))
    sc.render.filepath=str(BASE/'anteprime'/'confronto-landing.png')
    bpy.ops.render.render(write_still=True)
    logo_ctrl.location=old_location; logo_ctrl.scale=old_scale
    print('ANTEPRIME_COMPLETE')
