import {database} from '@/db';
export async function initialiseTryonAssets(){const db=database();if(await db.query('SELECT value FROM sheochand.settings WHERE key=$1',['photo_tryon_v1']).then(result=>result.rows[0]??null))return;await db.transaction([
{text:"UPDATE sheochand.products SET overlay_url=$1,ar_scale=$2,ar_offset=$3 WHERE id=$4 AND overlay_url=''",params:['/tryon/botanical-drop.png',.22,.02,'sj-02']},
{text:"UPDATE sheochand.products SET overlay_url=$1,ar_scale=$2,ar_offset=$3 WHERE id=$4 AND overlay_url=''",params:['/tryon/pearl-necklace.png',1.65,.07,'sj-04']},
{text:'INSERT INTO sheochand.settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING',params:['photo_tryon_v1','yes']}]);}
