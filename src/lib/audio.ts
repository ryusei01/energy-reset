import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { sineWav } from './tones';

export type ToneName = 'inhale' | 'exhale' | 'click';

const SPECS: Record<ToneName, Uint8Array> = {
  inhale: sineWav(528, 180, 0.18),
  exhale: sineWav(396, 240, 0.16),
  click: sineWav(880, 45, 0.2),
};

let preparing: Promise<void> | null = null;
const players = new Map<ToneName, AudioPlayer>();

async function prepare() {
  if (!preparing) {
    preparing = (async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      for (const name of Object.keys(SPECS) as ToneName[]) {
        const file = new File(Paths.cache, `energy-reset-${name}.wav`);
        if (file.exists) file.delete();
        file.create();
        file.write(SPECS[name]);
        players.set(name, createAudioPlayer(file.uri));
      }
    })().catch(error => {
      preparing = null;
      throw error;
    });
  }
  return preparing;
}

export async function playTone(name: ToneName) {
  try {
    await prepare();
    const player = players.get(name);
    if (!player) return;
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.error(error);
  }
}
