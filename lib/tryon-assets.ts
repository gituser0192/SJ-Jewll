import {database} from '@/db';
export async function initialiseTryonAssets(){const db=database();if(await db.prepare('SELECT value FROM settings WHERE key=?').bind('photo_tryon_v1').first())return;await db.batch([
db.prepare("UPDATE products SET overlay_url=?,ar_scale=?,ar_offset=? WHERE id=? AND overlay_url=''").bind('/tryon/botanical-drop.png',.22,.02,'sj-02'),
db.prepare("UPDATE products SET overlay_url=?,ar_scale=?,ar_offset=? WHERE id=? AND overlay_url=''").bind('/tryon/pearl-necklace.png',1.65,.07,'sj-04'),
db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind('photo_tryon_v1','yes')]);}
