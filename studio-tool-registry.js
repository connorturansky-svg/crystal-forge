import {searchStudioTools} from './studio-tool-search-core.js';

export const TOOL_FINDER_ITEMS=Object.freeze([
 {id:'mount-pattern',label:'Mounting patterns',workspace:'Mounting',
  aliases:['magnets in a circle','4 mounting holes grid','Hall effect','Hall sensor','mounting grid','screw spacing','holes in a line'],
  description:'Arrange holes and magnet pockets in a line, circle or grid.',
  panel:'[data-tool-mount-pattern]',control:'[data-pattern-field=kind]',advanced:true,editing:true,
  crystalSetup:'select[data-state=mount]',setupMessage:'Choose a supported mounting preset and set hole placement to Manual to enable patterns.'},
 {id:'fixing-tabs',label:'External fixing tabs',workspace:'Mounting',aliases:['fixing ears','edge tabs','attachments'],
  description:'Set the mounting preset or add external backing tabs.',
  crystal:'select[data-state=mount]',control:'[data-add-backing-tab]',advanced:true,editing:true},
 {id:'mount-hole',label:'Place mounting hole',workspace:'Mounting',aliases:['manual through-hole','screw fixing','threaded insert','magnet pocket'],
  description:'Place individual fixing holes and select a fixing profile.',
  crystal:'[data-tool-action=placeMountBtn]',control:'[data-place-mount]',editing:true},
 {id:'edge-finish',label:'Top edge bevel',workspace:'Build',aliases:['smooth sharp edges','bevel crystal','chamfer','edge finishing'],
  description:'Chamfer exposed flat top rims on the printable model.',
  control:'.sms-palette [data-edge-finish=enabled]',editing:true},
 {id:'pixel-coupon',label:'Pixel test coupon',workspace:'Pixels',aliases:['pixel test coupon','LED fitting test strip','pixel test fit'],
  description:'Download a printable socket fit test.',
  crystal:'[data-tool-action=calibrationBtn]',control:'[data-fit-print]'},
 {id:'pixel-socket',label:'LED sockets',workspace:'Pixels',aliases:['pixel fitting','LED hole','shaped socket','place pixel'],
  description:'Place a shaped socket or enable Crystal socket cutters.',
  crystal:'[data-state=cutSockets]',control:'[data-place-shaped]',editing:true},
 {id:'pixel-profile',label:'Measured pixel profile',workspace:'Pixels',aliases:['choose LED','gumdrop size','seed pixel dimensions'],
  description:'Create or edit a measured LED profile.',
  crystal:'[data-tool-action=editPixelProfileBtn]',control:'[data-pixel-profile-editor]'},
 {id:'wire-ports',label:'Wire IN OUT',workspace:'Wiring',aliases:['cable input output','serial LED connector','wire ports','wire direction'],
  description:'Find cable entry and exit controls where the model supports routing.',
  crystal:'#pickWireEntryBtn',control:'[data-native-edge=in]',advanced:true,routing:true},
 {id:'wire-pitch',label:'Cable spacing',workspace:'Wiring',aliases:['cable pitch','pixel wire spacing','wire length','wire spacing'],
  description:'Set the physical cable pitch.',
  crystal:'#wireSpacingPreset',control:'[data-native-pitch]',routing:true},
 {id:'wire-channel',label:'Cable channels',workspace:'Wiring',aliases:['enable channel','wire groove','serial cable route'],
  description:'Enable printable cable channels where the model supports routing.',
  crystal:'[data-state=wireChannels]',control:'[data-native-route]',routing:true},
 {id:'cura',label:'Cura profile',workspace:'Print Centre',aliases:['printer material settings','download Cura profile','slicer preset','nozzle'],
  description:'Open printer settings and Cura downloads.',control:'#smsCura',noModel:true},
 {id:'stl',label:'STL export',workspace:'Print Centre',aliases:['download STL','export geometry mesh'],
  description:'Find the STL download for the current prepared model.',
  control:'#smsJobs [data-job-stl]',prepare:true},
 {id:'3mf',label:'3MF export',workspace:'Print Centre',aliases:['download 3MF','export 3MF'],
  description:'Find the 3MF download for the current prepared model.',
  control:'#smsJobs [data-job-3mf]',prepare:true},
 {id:'prepare',label:'Prepare printable mesh',workspace:'Print Centre',aliases:['render actual model','print preview','manufacturing geometry'],
  description:'Prepare the current model using the manufacturing pipeline.',
  control:'#smsPrintCurrent button, #smsJobs [data-job-prepare]'},
 {id:'library',label:'Save project to Library',workspace:'Library',aliases:['save to library','store project','saved models'],
  description:'Find the project save action in Library.',control:'#smsSaveProject',noModel:true}
]);

export function rankToolFinderItems(query){
 return query.trim().toLowerCase()==='open'?TOOL_FINDER_ITEMS:
  searchStudioTools(TOOL_FINDER_ITEMS,query,{limit:7}).map(result=>result.item);
}
