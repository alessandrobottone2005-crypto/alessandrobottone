"""Assembla la landing in Blender senza sovrascrivere alcun sorgente.

Blender 5.2: --factory-startup -b --python sorgenti/landing/scripts/costruisci_landing.py
Le interfacce sono acquisite tramite Computer Use, poi prepara_interfacce.mjs crea l'atlante.
"""
import bpy
import json
import math
import random
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

BASE = Path(__file__).resolve().parents[1]
REPO = BASE.parents[1]
DEST = BASE / 'Landing_Completa.blend'
ST = json.loads((REPO / 'src/components/volto/stazioniSala.json').read_text())
MEAS = json.loads((REPO / 'src/components/computer/misureComputer.json').read_text())
UI = json.loads((BASE / 'interfacce/schermo.json').read_text())
W, H = 1920, 1080
TAN = math.tan(math.radians(ST['campo'] / 2))


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def move(obj, col):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def empty(name, col, size=.35):
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = 'PLAIN_AXES'
    o.empty_display_size = size
    col.objects.link(o)
    return o


def prop(obj, name, value, description, low=0, high=1):
    obj[name] = value
    obj.id_properties_ui(name).update(description=description, min=low, max=high, soft_min=low, soft_max=high)


def driver(owner, path, ctrl, variables, expression, index=-1):
    fc = owner.driver_add(path, index) if index >= 0 else owner.driver_add(path)
    d = fc.driver
    d.type = 'SCRIPTED'
    for symbol, property_name in variables.items():
        v = d.variables.new()
        v.name = symbol
        v.type = 'SINGLE_PROP'
        v.targets[0].id = ctrl
        v.targets[0].data_path = f'["{property_name}"]'
    d.expression = expression
    return fc


def gltf_point(p):
    # glTF y-up -> Blender z-up (conversion effectuée par l'importeur).
    return Vector((p[0], -p[2], p[1]))


def bound_corners(b):
    return [gltf_point([b['max' if i & (1 << k) else 'min'][k] for k in range(3)]) for i in range(8)]


def camera(name, eye, target, col, focus=None):
    d = bpy.data.cameras.new(name)
    d.sensor_fit = 'VERTICAL'
    d.sensor_height = 24
    d.lens = d.sensor_height / (2 * TAN)
    d.clip_start, d.clip_end = .05, 300
    o = bpy.data.objects.new(name, d)
    col.objects.link(o)
    o.location = eye
    o.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
    d.dof.use_dof = True
    d.dof.focus_object = focus
    d.dof.aperture_fstop = 5.6
    return o


def light(name, kind, col, position=(0, 0, 0), power=100, color=(1, 1, 1), size=1, target=None):
    d = bpy.data.lights.new(name, kind)
    d.energy = power
    d.color = color
    if kind == 'AREA':
        d.shape = 'RECTANGLE'
        d.size = size
        d.size_y = size
    o = bpy.data.objects.new(name, d)
    col.objects.link(o)
    o.location = position
    if target is not None:
        o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o


def interp(action, mode='BEZIER'):
    if not action:
        return
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation = mode
                        k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'


def clip(ctrl, name, channels):
    ctrl.animation_data_create()
    ctrl.animation_data.action = None
    for key, values in channels.items():
        for frame, value in values:
            ctrl[key] = value
            ctrl.keyframe_insert(data_path=f'["{key}"]', frame=frame, group=name)
    action = ctrl.animation_data.action
    action.name = name
    action.use_fake_user = True
    action.asset_mark()
    action.asset_data.description = 'Clip riutilizzabile del CTRL LOGO; parametri separati dalle interfacce del monitor.'
    interp(action)
    ctrl.animation_data.action = None
    for key in channels:
        ctrl[key] = 0.0
    return action


def strip(ctrl, name, action, start):
    track = ctrl.animation_data.nla_tracks.new()
    track.name = name
    s = track.strips.new(name, start, action)
    s.extrapolation = 'NOTHING'
    s.blend_type = 'REPLACE'
    return s


bpy.ops.wm.open_mainfile(filepath=str(REPO / 'sorgenti/sala/Sala_Realistica.blend'))
sc = bpy.context.scene
sc.name = 'landing · alessandro bottone'
# Rende assoluti i percorsi relativi mentre la sorgente è ancora aperta.
for im in bpy.data.images:
    if im.source == 'FILE' and im.filepath and not im.packed_file:
        im.filepath = bpy.path.abspath(im.filepath)

cols = {key: collection(label) for key, label in [
    ('room', '01 · stanza brutalista'), ('desk', '02 · postazione Macintosh'),
    ('logo', '03 · logo e controlli'), ('lights', '04 · illuminazione'),
    ('atmos', '05 · atmosfera e pulviscolo'), ('cams', '06 · camere della landing'),
    ('screen', '07 · schermo e interfacce')
]}
for o in list(bpy.data.objects):
    if o.name == 'segnaposto_computer':
        bpy.data.objects.remove(o, do_unlink=True)
    elif o.type == 'LIGHT':
        move(o, cols['lights'])
    else:
        move(o, cols['room'])

# Importa il derivato senza marchi, già preparato per la landing; gli originali restano intatti.
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(REPO / 'sorgenti/computer/export/Postazione.glb'))
imported = set(bpy.data.objects) - before
desk = empty('POSTAZIONE · sposta insieme scrivania e Macintosh', cols['desk'])
desk.location = ST['computer']['punto']
desk.rotation_euler.z = math.pi / 2
desk.scale = (MEAS['scala'],) * 3
for o in imported:
    move(o, cols['desk'])
    if o.parent not in imported:
        o.parent = desk

# Il piano dello schermo coincide con i quattro angoli condivisi tra DOM e GLB.
mesh = bpy.data.meshes.new('CRT · piano del vetro originale')
corners = [gltf_point(p) for p in MEAS['vetro']]
mesh.from_pydata(corners, [], [(3, 2, 1, 0)])
mesh.update()
uv = mesh.uv_layers.new(name='schermo')
uvs = [(0, 1), (1, 1), (1, 0), (0, 0)]
for loop in mesh.loops:
    uv.data[loop.index].uv = uvs[loop.vertex_index]
screen = bpy.data.objects.new('CRT · tue interfacce', mesh)
cols['screen'].objects.link(screen)
screen.parent = desk
screen.pass_index = 1
ctrl_screen = empty('CTRL SCHERMO · stato e animazione', cols['screen'])
ctrl_screen.location = Vector(ST['computer']['punto']) + Vector((1.8, -1.5, 1.2))
prop(ctrl_screen, 'stato', 3, '0 spento · 1 avvio · 2 disturbo · 3 desktop · 4 illustrazione · 5 branding · 6 3d · 7 paint · 8 scacchi · 9 progetto', 0, 9)
prop(ctrl_screen, 'fotogramma_avvio', 0., 'Fotogramma nell’avvio originale (0–109), a 24 fps.', 0, 109)
prop(ctrl_screen, 'luminosita', .85, 'Luminosità del tubo; indipendente dalla sequenza.', 0, 5)

mat = bpy.data.materials.new('CRT · interfacce reali incorporate')
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
nodes.clear()
out = nodes.new('ShaderNodeOutputMaterial'); out.location = (700, 0)
em = nodes.new('ShaderNodeEmission'); em.location = (490, 0)
links.new(em.outputs[0], out.inputs['Surface'])
driver(em.inputs['Strength'], 'default_value', ctrl_screen, {'s': 'stato', 'l': 'luminosita'}, 'l if s>0 else 0.018')
tex = nodes.new('ShaderNodeTexImage'); tex.name = 'ATLANTE · tutte le schermate incorporate'; tex.location = (230, 0)
tex.image = bpy.data.images.load(str(BASE / 'interfacce/schermo-atlante.png'))
tex.image.pack()
tex.interpolation = 'Closest'; tex.extension = 'EXTEND'
links.new(tex.outputs['Color'], em.inputs['Color'])
coord = nodes.new('ShaderNodeTexCoord'); coord.location = (-620, 0)
scale = nodes.new('ShaderNodeVectorMath'); scale.operation = 'MULTIPLY'; scale.location = (-410, 0)
scale.inputs[1].default_value = (1 / UI['columns'], 1 / UI['rows'], 1)
links.new(coord.outputs['UV'], scale.inputs[0])
offset = nodes.new('ShaderNodeCombineXYZ'); offset.location = (-410, -200)
state_indices = [UI['states'][s] for s in ['desktop', 'illustrazione', 'branding', '3d', 'paint', 'scacchi', 'progetto']]
# Non usare liste nelle espressioni dei driver: soltanto operazioni semplici, sicure senza auto-run.
choice = str(state_indices[-1])
for i in reversed(range(6)):
    choice = f'({state_indices[i]} if s<{i+3}.5 else {choice})'
tile_expr = f'(0 if s<0.5 else (1+min(109,max(0,floor(f))) if s<1.5 else (80 if s<2.5 else {choice})))'
ctrl_screen['tessera_atlante'] = 0.
driver(ctrl_screen, '["tessera_atlante"]', ctrl_screen, {'s':'stato', 'f':'fotogramma_avvio'}, tile_expr)
driver(offset.inputs['X'], 'default_value', ctrl_screen, {'t':'tessera_atlante'}, f'(t%{UI["columns"]})/{UI["columns"]}')
driver(offset.inputs['Y'], 'default_value', ctrl_screen, {'t':'tessera_atlante'}, f'1-(floor(t/{UI["columns"]})+1)/{UI["rows"]}')
add = nodes.new('ShaderNodeVectorMath'); add.operation = 'ADD'; add.location = (-130, 0)
links.new(scale.outputs[0], add.inputs[0]); links.new(offset.outputs[0], add.inputs[1]); links.new(add.outputs[0], tex.inputs['Vector'])
screen.data.materials.append(mat)

# Append selettivo: solo la gerarchia del logo, senza il cubo volumetrico e lo studio originale.
with bpy.data.libraries.load(str(REPO / 'sorgenti/logo-3d/Logo3DAnimabile_MetalloGrezzo_V2.blend'), link=False) as (source, target):
    target.collections = ['01 · logo animabile']
logo_col = target.collections[0]
sc.collection.children.link(logo_col)
root = bpy.data.objects['logo_root']
logo_objects = [root, *root.children_recursive]
for o in list(logo_col.all_objects):
    if o not in logo_objects:
        bpy.data.objects.remove(o, do_unlink=True)
for o in logo_objects:
    move(o, cols['logo'])
    if o.animation_data:
        o.animation_data_clear()
    if o.type == 'MESH' and o.data.shape_keys:
        o.data.shape_keys.animation_data_clear()
        for k in o.data.shape_keys.key_blocks:
            if k.name != 'Basis':
                k.value = 0
root.rotation_euler = (0, 0, 0)

# Camera larga identica alla sosta zoom=0, da inquadratura.ts (17°, riempimento .90/.82).
post_matrix = Matrix.Translation(Vector(ST['computer']['punto'])) @ Matrix.Rotation(math.pi / 2, 4, 'Z') @ Matrix.Diagonal(Vector((MEAS['scala'],)*3 + (1.,)))
body_corners = [post_matrix @ p for p in bound_corners(MEAS['postazione'])]
wide_box = {k: list(v) for k, v in MEAS['postazione'].items()}
wide_box['max'][1] += .16
wide_corners = [post_matrix @ p for p in bound_corners(wide_box)]
aim = sum(wide_corners, Vector()) / 8
toward = Vector((0, -math.cos(math.radians(17)), math.sin(math.radians(17))))
right = Vector((0, 0, 1)).cross(toward).normalized()
up = toward.cross(right)
def wide_eye(aspect):
    distance = max(max((p-aim).dot(toward) + abs((p-aim).dot(right))/(TAN*aspect*.9), (p-aim).dot(toward) + abs((p-aim).dot(up))/(TAN*.82)) for p in wide_corners)
    return aim + toward * distance

world_corners = [post_matrix @ p for p in corners]
center = sum(world_corners, Vector()) / 4
normal = (world_corners[1] - world_corners[0]).cross(world_corners[0] - world_corners[3]).normalized()
focus = empty('FUOCO · schermo del Macintosh', cols['cams'], .1); focus.location = center
wide = camera('01 · landing · postazione ampia', wide_eye(W/H), aim, cols['cams'], focus)
near_distance = max((world_corners[0]-world_corners[3]).length/(2*TAN*.5), (world_corners[0]-world_corners[1]).length/(2*TAN*(W/H)*.6))
near = camera('02 · landing · dettaglio del monitor', center + normal*near_distance, center, cols['cams'], focus)
near.data.dof.aperture_fstop = 8
general = camera('03 · landing · vista generale della sala', ST['contatti']['occhio'], ST['contatti']['punto'], cols['cams'])
general.data.dof.use_dof = False
overhead = camera('04 · landing · discesa sopra la scrivania', Vector(ST['computer']['punto']) + Vector((0,-13,12)), aim, cols['cams'], focus)
header = camera('05 · landing · header', ST['header']['occhio'], ST['header']['punto'], cols['cams'])
header.data.dof.use_dof = False
reference = camera('06 · verifica · postazione 976x1072', wide_eye(976/1072), aim, cols['cams'], focus)
reference.data.dof.use_dof = False

# Colloca il logo dalla proiezione del monitor, con la stessa scala e occlusione della landing.
bpy.context.view_layer.update()
monitor_world = [post_matrix @ p for p in bound_corners(MEAS['monitor'])]
def logo_pose(cam, width, height):
    view = cam.matrix_world.inverted()
    points = [view @ p for p in monitor_world]
    px = [(p.x/-p.z/TAN/(width/height)*.5+.5)*width for p in points]
    py = [(.5-p.y/-p.z/TAN*.5)*height for p in points]
    L = 1.25*(max(px)-min(px))
    lens_bottom = (60.6 + 44.4 + 13.6/2 - 176.88/2)/247.41
    eye_top = (47.85 - 24.24 - 176.88/2)/247.41
    x = (min(px)+max(px))/2
    y = max(min(py)-.03*L-lens_bottom*L, .03*L-eye_top*L)
    depth = max(-p.z for p in points)+.5
    units = 2*depth*TAN/height
    location = cam.matrix_world @ Vector(((x-width/2)*units, -(y-height/2)*units, -depth))
    return location, L*units

minimum = Vector((1e10,)*3); maximum = -minimum
for o in logo_objects:
    if o.type == 'MESH':
        for v in o.data.vertices:
            p = o.matrix_world @ v.co
            for k in range(3):
                minimum[k] = min(minimum[k], p[k]); maximum[k] = max(maximum[k], p[k])
logo_center = (minimum+maximum)/2
root.location = -logo_center
rig = empty('CTRL LOGO · posizione e animazioni', cols['logo'], .5)
root.parent = rig
loc, logo_width = logo_pose(wide, W, H)
rig.location = loc
rig.scale = (logo_width/(maximum.x-minimum.x),)*3
rig.rotation_mode = 'QUATERNION'
rig.rotation_quaternion = wide.rotation_euler.to_quaternion() @ Quaternion((1,0,0), -math.pi/2)
for key, desc in [
    ('battito','Chiusura di entrambi gli occhi.'), ('occhiolino','Chiusura dell’occhio destro.'),
    ('sorriso','Sorriso e lieve chiusura delle palpebre.'), ('sonno','Palpebre chiuse e inclinazione della testa.'),
    ('sguardo_x','Direzione orizzontale delle pupille.'), ('sguardo_y','Direzione verticale delle pupille.')
]:
    prop(rig, key, 0., desc, -1 if key.startswith('sguardo') else 0, 1)
for side in ['sx','dx']:
    for part in ['palpebra', 'pupilla']:
        keys = bpy.data.objects[f'{part}_{side}'].data.shape_keys
        expr = 'min(1,max(b,n,w,0.16*s))' if side=='dx' else 'min(1,max(b,n,0.16*s))'
        variables = {'b':'battito','n':'sonno','s':'sorriso'}
        if side == 'dx': variables['w'] = 'occhiolino'
        driver(keys.key_blocks['chiusura'], 'value', rig, variables, expr)
    eye = bpy.data.objects[f'sguardo_{side}']
    driver(eye, 'location', rig, {'x':'sguardo_x'}, f'{eye.location.x:.9f}+0.09*x', 0)
    driver(eye, 'location', rig, {'y':'sguardo_y'}, f'{eye.location.z:.9f}+0.05*y', 2)
driver(bpy.data.objects['sorriso'].data.shape_keys.key_blocks['sorriso_ampio'], 'value', rig, {'s':'sorriso'}, 's')
driver(bpy.data.objects['testa'], 'rotation_euler', rig, {'n':'sonno'}, 'n*(0.10+sin(frame/12)*0.012)', 0)
driver(bpy.data.objects['testa'], 'rotation_euler', rig, {'n':'sonno'}, 'n*0.055', 1)

b = clip(rig,'logo · battito',{'battito':[(1,0),(3,1),(5,1),(9,0)]})
w = clip(rig,'logo · occhiolino',{'occhiolino':[(1,0),(4,1),(8,1),(14,0)]})
s = clip(rig,'logo · sorriso',{'sorriso':[(1,0),(10,1),(26,1),(40,0)]})
n = clip(rig,'logo · sonno e risveglio',{'sonno':[(1,0),(18,1),(48,1),(72,0)]})
g = clip(rig,'logo · sguardo',{'sguardo_x':[(1,0),(20,-1),(40,.8),(65,.3),(96,0)], 'sguardo_y':[(1,0),(20,.25),(40,-.5),(65,.7),(96,0)]})
for a, start, name in [(g,1,'01 · sguardo'),(b,75,'02 · battito'),(w,110,'03 · occhiolino'),(s,145,'04 · sorriso'),(n,220,'05 · sonno e risveglio'),(b,340,'06 · battito')]:
    strip(rig,name,a,start)

# Sole dalla fessura, tre fari bianchi dedicati al logo e luce locale del CRT.
sun = bpy.data.objects['sole']
sun.name = 'SOLE · fessura arancione'
sun.data.color = (1, .1946, .0176)  # #ff7a24 convertito in lineare.
sun.data.energy = 8.296723365783691
sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .035
floor_mat = bpy.data.materials['cemento_pavimento']
floor_nodes, floor_links = floor_mat.node_tree.nodes, floor_mat.node_tree.links
floor_bsdf = floor_nodes.get('Principled BSDF')
wet = floor_nodes.new('ShaderNodeMapRange'); wet.label = 'pellicola d’acqua nelle chiazze bagnate'
wet.inputs['From Min'].default_value = .06; wet.inputs['From Max'].default_value = .45
wet.inputs['To Min'].default_value = .7; wet.inputs['To Max'].default_value = 0
floor_links.new(floor_nodes.get('Image Texture.001').outputs['Color'],wet.inputs['Value'])
floor_links.new(wet.outputs['Result'],floor_bsdf.inputs['Coat Weight'])
floor_bsdf.inputs['Coat Roughness'].default_value = .035
receivers = bpy.data.collections.new('LINK · sole su stanza e computer')
for o in [*cols['room'].objects, *cols['desk'].objects]:
    if o.type == 'MESH': receivers.objects.link(o)
sun.light_linking.receiver_collection = receivers
logo_receivers = bpy.data.collections.new('LINK · fari solo sul logo')
floor_receivers = bpy.data.collections.new('LINK · riflessi sul pavimento')
floor_receivers.objects.link(bpy.data.objects['pavimento'])
for o in logo_objects:
    if o.type == 'MESH': logo_receivers.objects.link(o)
for index, (p,power) in enumerate([((-3.9167,-1.643,3.3025),86),((4.1833,-.5812,4.1774),86),((-.498,2.8946,1.0887),40)]):
    l = light(f'FARO LOGO · {index+1}', 'AREA', cols['lights'], power=power, size=1)
    l.parent = rig; l.location = Vector(p)
    l.data.energy = power * .8 * rig.scale.x ** 2
    l.rotation_euler = (-l.location).to_track_quat('-Z','Y').to_euler()
    l.light_linking.receiver_collection = logo_receivers
    reflected = light(f'RIFLESSO · faro {index+1}', 'AREA', cols['lights'], power=l.data.energy, size=1)
    reflected.parent = rig; reflected.location = l.location; reflected.rotation_euler = l.rotation_euler
    reflected.data.diffuse_factor = 0; reflected.data.volume_factor = 0
    reflected.light_linking.receiver_collection = floor_receivers
crt = light('CRT · luce su tastiera e scrivania', 'AREA', cols['lights'], center+normal*.03, power=4, color=(1,.86,.66), size=.3)
crt.rotation_euler = normal.to_track_quat('-Z','Y').to_euler()
driver(crt.data,'energy',ctrl_screen,{'s':'stato','l':'luminosita'},'4*l if s>0 else 0')

# Volume della stanza: densità piccola, sole tagliato dalla geometria vera del soffitto.
room_min, room_max = Vector(ST['sala']['min']), Vector(ST['sala']['max'])
bpy.ops.mesh.primitive_cube_add(size=1, location=(room_min+room_max)/2)
vol = move(bpy.context.object, cols['atmos']); vol.name = 'ATMOSFERA · fascio volumetrico'
vol.scale = room_max-room_min
vol.display_type = 'WIRE'
volume_mat = bpy.data.materials.new('aria · densità leggera'); volume_mat.use_nodes = True
vn = volume_mat.node_tree.nodes; vn.clear()
vo = vn.new('ShaderNodeOutputMaterial'); pv = vn.new('ShaderNodeVolumePrincipled')
pv.inputs['Density'].default_value = .008
pv.inputs['Color'].default_value = (.7,.7,.7,1)
pv.inputs['Anisotropy'].default_value = .35
volume_mat.node_tree.links.new(pv.outputs['Volume'],vo.inputs['Volume'])
vol.data.materials.append(volume_mat)

random.seed(20261006)
dust_mesh = bpy.data.meshes.new('pulviscolo · 9000 granelli')
vertices, faces = [], []
sun_dir = sun.rotation_euler.to_matrix() @ Vector((0,0,-1))
for i in range(9000):
    z = random.uniform(.12,16)
    travel = (ST['soffitto']-z)/max(.01,-sun_dir.z)
    p = Vector((random.uniform(-ST['fessura']*.95,ST['fessura']*.95),random.uniform(room_min.y+2,room_max.y-2),ST['soffitto'])) + sun_dir*travel
    if i < 3000:
        p = Vector(ST['computer']['punto'])+Vector((random.uniform(-4,4),random.uniform(-4,4),random.uniform(.2,7)))
    r = random.uniform(.0012,.003)
    start = len(vertices)
    vertices.extend([p+Vector((r,0,0)),p+Vector((-r,0,0)),p+Vector((0,r,0)),p+Vector((0,0,r*1.6))])
    faces.extend([(start,start+2,start+3),(start+2,start+1,start+3),(start+1,start,start+3),(start,start+1,start+2)])
dust_mesh.from_pydata(vertices,[],faces); dust_mesh.update()
dust = bpy.data.objects.new('PULVISCOLO · lento movimento',dust_mesh); cols['atmos'].objects.link(dust)
dm = bpy.data.materials.new('polvere · particelle nel fascio'); dm.diffuse_color=(.45,.4,.32,1); dm.use_nodes=True
bsdf = dm.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(.45,.4,.32,1); bsdf.inputs['Roughness'].default_value=.8
dust_mesh.materials.append(dm)
receivers.objects.link(dust)
dust.location.z = 0; dust.keyframe_insert(data_path='location',frame=1)
dust.location.z = .15; dust.keyframe_insert(data_path='location',frame=385)
interp(dust.animation_data.action)

# Sequenza dimostrativa del monitor, distinta dalle clip del logo.
for frame, value in [(1,0),(24,1),(134,3),(168,4),(216,5),(264,6),(312,7),(348,8),(384,9),(432,3)]:
    ctrl_screen['stato']=value
    ctrl_screen.keyframe_insert(data_path='["stato"]',frame=frame,group='sequenza schermo')
for frame,value in [(24,0),(133,109),(432,109)]:
    ctrl_screen['fotogramma_avvio']=value
    ctrl_screen.keyframe_insert(data_path='["fotogramma_avvio"]',frame=frame,group='avvio originale')
ctrl_screen.animation_data.action.name='schermo · avvio e interfacce reali'
for layer in ctrl_screen.animation_data.action.layers:
    for st in layer.strips:
        for bag in st.channelbags:
            for fc in bag.fcurves:
                for key in fc.keyframe_points:
                    key.interpolation='CONSTANT' if 'stato' in fc.data_path else 'LINEAR'

# Compositore Blender 5.2: noir con arancio selettivo; schermo originale preservato.
sc.render.engine='CYCLES'
sc.cycles.samples=128; sc.cycles.use_denoising=True
sc.cycles.max_bounces=8; sc.cycles.diffuse_bounces=4; sc.cycles.glossy_bounces=4; sc.cycles.volume_bounces=2
sc.cycles.adaptive_threshold=.025
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'; prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='METAL'
    sc.cycles.device='GPU'
except Exception:
    sc.cycles.device='CPU'
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'; sc.view_settings.exposure=-.9
sc.render.resolution_x=W; sc.render.resolution_y=H; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.render.fps=24; sc.frame_start=1; sc.frame_end=432
sc.render.film_transparent=False
sc.view_layers[0].use_pass_object_index=True
sc.view_layers[0].update_render_passes()
tree=bpy.data.node_groups.new('LANDING · noir e arancio selettivo','CompositorNodeTree')
tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
sc.compositing_node_group=tree
cn,cl=tree.nodes,tree.links
rl=cn.new('CompositorNodeRLayers'); rl.location=(-700,100); rl.scene=sc; rl.layer=sc.view_layers[0].name
grey=cn.new('CompositorNodeHueSat'); grey.label='bianco e nero noir'; grey.inputs['Saturation'].default_value=0; grey.location=(-440,160)
cl.new(rl.outputs['Image'],grey.inputs['Image'])
orange=cn.new('CompositorNodeHueSat'); orange.label='arancio caldo, saturazione controllata'; orange.inputs['Saturation'].default_value=.60; orange.location=(-220,300)
cl.new(rl.outputs['Image'],orange.inputs['Image'])
hsv=cn.new('CompositorNodeSeparateColor'); hsv.mode='HSV'; hsv.location=(-700,-180); cl.new(rl.outputs['Image'],hsv.inputs[0])
def cmath(op,label,a,b=None,position=(0,0)):
    node=cn.new('ShaderNodeMath'); node.operation=op; node.label=label; node.location=position
    if isinstance(a,(int,float)): node.inputs[0].default_value=a
    else: cl.new(a,node.inputs[0])
    if b is not None:
        if isinstance(b,(int,float)): node.inputs[1].default_value=b
        else: cl.new(b,node.inputs[1])
    return node.outputs[0]
warm=cmath('LESS_THAN','tinta arancio',hsv.outputs[0],.145,(-440,-130))
sat=cmath('GREATER_THAN','solo colore',hsv.outputs[1],.08,(-440,-280))
mask=cmath('MULTIPLY','sole selettivo',warm,sat,(-240,-180))
mix=cn.new('ShaderNodeMix'); mix.data_type='RGBA'; mix.location=(0,100)
cl.new(mask,mix.inputs[0]); cl.new(grey.outputs[0],mix.inputs[6]); cl.new(orange.outputs['Image'],mix.inputs[7])
idmask=cn.new('CompositorNodeIDMask'); idmask.inputs['Index'].default_value=1; idmask.inputs['Anti-Alias'].default_value=True; idmask.location=(-100,-350)
cl.new(rl.outputs['Object Index'],idmask.inputs['ID value'])
preserve=cn.new('ShaderNodeMix'); preserve.data_type='RGBA'; preserve.label='interfacce e progetti a colori'; preserve.location=(230,100)
cl.new(idmask.outputs[0],preserve.inputs[0]); cl.new(mix.outputs[2],preserve.inputs[6]); cl.new(rl.outputs['Image'],preserve.inputs[7])
glare=cn.new('CompositorNodeGlare'); glare.label='alone leggero sulle luci'; glare.location=(450,100)
glare.inputs['Type'].default_value='Fog Glow'; glare.inputs['Threshold'].default_value=.82; glare.inputs['Strength'].default_value=.12
cl.new(preserve.outputs[2],glare.inputs['Image'])
ellipse=cn.new('CompositorNodeEllipseMask'); ellipse.label='vignetta cinematografica'; ellipse.location=(200,-550)
ellipse.inputs['Size'].default_value=(.88,.94)
blur=cn.new('CompositorNodeBlur'); blur.inputs['Size'].default_value=(240,170); blur.location=(430,-400)
cl.new(ellipse.outputs[0],blur.inputs['Image'])
shade=cmath('ADD','bordi morbidi',cmath('MULTIPLY','vignetta',blur.outputs[0],.68,(650,-400)),.32,(840,-400))
vignette=cn.new('ShaderNodeMix'); vignette.data_type='RGBA'; vignette.blend_type='MULTIPLY'; vignette.inputs[0].default_value=1; vignette.location=(750,100)
cl.new(glare.outputs['Image'],vignette.inputs[6]); cl.new(shade,vignette.inputs[7])
lens=cn.new('CompositorNodeLensdist'); lens.label='aberrazione lieve della landing'; lens.inputs['Dispersion'].default_value=.0011; lens.inputs['Fit'].default_value=True; lens.location=(970,100)
cl.new(vignette.outputs[2],lens.inputs['Image'])
output=cn.new('NodeGroupOutput'); output.location=(1200,100); cl.new(lens.outputs['Image'],output.inputs['Image'])

# Elimina soltanto dati inutilizzati della nuova scena, quindi incorpora ogni risorsa effettiva.
for c in list(bpy.data.collections):
    if c not in cols.values() and not c.name.startswith('LINK ·') and len(c.objects)==0 and len(c.children)==0:
        bpy.data.collections.remove(c)
for m in list(bpy.data.materials):
    if m.users==0: bpy.data.materials.remove(m)
for group in list(bpy.data.node_groups):
    if group.users==0: bpy.data.node_groups.remove(group)
for image in list(bpy.data.images):
    if image.name in ['Render Result','Viewer Node']: continue
    image.use_fake_user = False  # esclude soltanto le cache di bake non usate da questa scena.
    if image.users==0:
        bpy.data.images.remove(image)
        continue
    if image.source=='FILE' and not image.packed_file:
        resolved=Path(bpy.path.abspath(image.filepath))
        if not resolved.exists(): raise FileNotFoundError(f'Texture mancante: {image.name} {resolved}')
        image.pack()

guide='''LANDING COMPLETA · alessandro bottone

SCENA
Stessa sala, stessa postazione Macintosh e logo V2 della landing.
Oggetti e texture originali conservati; tutte le immagini effettive incorporate.
Camere e compositing sono tarati per la resa web, con render Cycles.

CAMERE
01: postazione ampia, attiva all'apertura. 02: monitor. 03: sala generale.
04: vista dall'alto. 05: header. 06: confronto 976x1072.
Seleziona una camera e Ctrl+Numpad0 per renderizzare da quella camera.
Le camere non sono animate: scegli liberamente le tue inquadrature.

SCHERMO
Seleziona CTRL SCHERMO, Proprietà oggetto > Proprietà personalizzate.
stato: 0 spento, 1 avvio, 2 disturbo, 3 desktop, 4 illustrazione,
5 branding, 6 3d, 7 paint, 8 scacchi, 9 progetto lorenzo.
Per uno stato manuale, scollega prima l'azione del CTRL SCHERMO nell'Action Editor.
L'azione rimane conservata: schermo · avvio e interfacce reali.
fotogramma_avvio: 0–109. luminosita: indipendente dalla sequenza.
La sequenza di avvio è acquisita dal sito a intervalli reali e normalizzata a 24fps;
le prime schermate hanno la risoluzione dell'inquadratura larga durante lo zoom.
L'atlante è un'immagine incorporata: non richiede video o PNG esterni.

LOGO
Seleziona CTRL LOGO: posizione, orientamento e scala muovono insieme il logo e i fari.
Le proprietà battito, occhiolino, sorriso, sonno, sguardo_x e sguardo_y
pilotano le shape key e le pupille. I driver sono semplici, senza script auto-run.
NLA: clip riutilizzabili logo · battito, occhiolino, sorriso, sonno e risveglio, sguardo.
Per impostare espressioni manualmente, silenzia le tracce NLA del CTRL LOGO.
La camera ampia riproduce il logo sporgente sopra il monitor, nelle dimensioni del sito.
La posizione resta fisica nella stanza cambiando camera: il sito invece ricompone
il logo in spazio schermo a ogni posa. Per altre viste puoi riposizionare CTRL LOGO.

RENDER
1920x1080, 24fps, Cycles, AgX, 128 campioni con denoising.
Timeline dimostrativa 1–432, libera da modificare. Il file apre sul desktop (frame 150).
Sole arancione, cemento PBR, pavimento bagnato, nebbia leggera, 9000 granelli.
Fari collegati soltanto al logo; sole collegato a stanza e postazione.
Per togliere la polvere o il volume dal render, nascondi la collezione atmosfera.

CREDITI
Postazione: Macintosh 128K, kreems, CC BY 4.0.
https://sketchfab.com/3d-models/macintosh-128k-896ea439b67b4606a23fb8b93be6af6d
Modifiche derivate dal sito: marchi rimossi, CRT adattato, scala e orientamento.
Sala: Brutalism Scene Baked, abhayexe, Free Standard Sketchfab, con attribuzione.
https://sketchfab.com/3d-models/brutalism-scene-baked-93ba334484ca44058f6dde30a3d4f066
Cemento: Modular Concrete Interior (CC0). Metallo: ambientCG Metal032 (CC0).
ChicagoFLF: Robin Casady, dominio pubblico. Logo, interfacce e progetti: Alessandro Bottone.
'''
bpy.data.texts.new('LEGGIMI · camere, schermo e logo').write(guide)
sc['riferimento']='landing locale corrente · 6 ottobre 2026'
sc['fedelta']='Geometrie e trasformazioni originali; resa Cycles confrontata nelle anteprime.'
sc['camera_larga_logo_posizione']=list(rig.location)
sc['camera_larga_logo_scala']=rig.scale.x
for frame,label in [(1,'spento'),(24,'avvio hello e disturbo'),(134,'desktop'),(168,'illustrazione'),(216,'branding'),(264,'3d'),(312,'paint'),(348,'scacchi'),(384,'progetto lorenzo')]:
    marker=sc.timeline_markers.new(label,frame=frame)
sc.camera=wide
sc.frame_set(150)
ctrl_screen['stato']=3  # frame 150 = desktop; pronta per un render fermo.
sc.render.filepath='//anteprime/render.png'
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True); bpy.context.view_layer.objects.active=rig
for screen_ui in bpy.data.screens:
    for area in screen_ui.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.clip_end=300
            area.spaces.active.shading.type='MATERIAL'
        elif area.type=='PROPERTIES': area.spaces.active.context='OBJECT'
bpy.ops.wm.save_as_mainfile(filepath=str(DEST),compress=True)
(BASE/'README.md').write_text('# scena Blender della landing\n\n'+guide)
report={
    'blender':bpy.app.version_string, 'file':str(DEST), 'objects':len(sc.objects),
    'collections':[c.name for c in sc.collection.children],
    'packed_images':[i.name for i in bpy.data.images if i.packed_file],
    'screen_states':UI['states'], 'logo_location':list(rig.location), 'logo_scale':rig.scale.x,
    'cameras':{o.name:{'eye':list(o.location),'rotation':list(o.rotation_euler),'vertical_fov':math.degrees(o.data.angle_y)} for o in cols['cams'].objects if o.type=='CAMERA'},
    'source_geometry_preserved':True,
}
(BASE/'verifica-assemblaggio.json').write_text(json.dumps(report,indent=2)+'\n')
print('LANDING_COMPLETA',str(DEST))
