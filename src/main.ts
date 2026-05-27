import './styles.css';
import { router } from './router';
import { MainMenu } from './screens/MainMenu';
import { WorldMap } from './screens/WorldMap';
import { Combat } from './screens/Combat';
import { GameOver } from './screens/GameOver';
import { Victory } from './screens/Victory';
import { Shop } from './screens/Shop';
import { Treasure } from './screens/Treasure';
import { RoomMap } from './screens/RoomMap';
import { PerkSelect } from './screens/PerkSelect';

// Design-Auflösung — alle Screens werden in dieser Koordinatengröße entworfen
// und per CSS-Transform auf den tatsächlichen Viewport skaliert (siehe .cm-fit
// in styles.css). FIT-Verhalten: das größtmögliche, das ohne Beschneiden passt.
const DESIGN_W = 1280;
const DESIGN_H = 800;

function updateUiScale(): void {
  const scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  document.documentElement.style.setProperty('--ui-scale', String(scale));
}

updateUiScale();
window.addEventListener('resize', updateUiScale);

router.register('menu', MainMenu);
router.register('worldmap', WorldMap);
router.register('combat', Combat);
router.register('gameover', GameOver);
router.register('victory', Victory);
router.register('shop', Shop);
router.register('treasure', Treasure);
router.register('roommap', RoomMap);
router.register('perk', PerkSelect);

router.mount(document.getElementById('app')!);
router.go('menu');
