import { songKey, makeSongCard } from '../../../frontend/utils.js';

// ── songKey ──────────────────────────────────────────────────────────────────

describe('songKey', () => {
    test('TC-F-001: returns song_id directly when present', () => {
        const song = {
            song_id: 'Love Story#2008#Fearless',
            title: 'Love Story', year: '2008', album: 'Fearless',
        };
        expect(songKey(song)).toBe('Love Story#2008#Fearless');
    });

    test('TC-F-002: constructs title#year#album when no song_id', () => {
        const song = { title: 'Love Story', year: '2008', album: 'Fearless' };
        expect(songKey(song)).toBe('Love Story#2008#Fearless');
    });

    test('TC-F-003: empty song object produces undefined#undefined#undefined (documents fragility)', () => {
        expect(songKey({})).toBe('undefined#undefined#undefined');
    });
});

// ── makeSongCard ──────────────────────────────────────────────────────────────

const BASE_SONG = {
    title: 'Love Story',
    artist: 'Taylor Swift',
    album: 'Fearless',
    year: '2008',
    img_url: 'http://example.com/taylor.jpg',
};

describe('makeSongCard', () => {
    test('TC-F-004: card has song-card class and expected child elements', () => {
        const card = makeSongCard(BASE_SONG, 'Subscribe', jest.fn());
        expect(card.className).toBe('song-card');
        expect(card.querySelector('img.song-img')).not.toBeNull();
        expect(card.querySelector('div.song-info')).not.toBeNull();
        expect(card.querySelector('button')).not.toBeNull();
    });

    test('TC-F-005: title, artist, album text content is correct', () => {
        const card = makeSongCard(BASE_SONG, 'Subscribe', jest.fn());
        expect(card.querySelector('.song-title').textContent).toBe('Love Story');
        expect(card.querySelector('.song-artist').textContent).toBe('Taylor Swift');
        expect(card.querySelector('.song-album').textContent).toBe('Fearless (2008)');
    });

    test('TC-F-006: Remove label gives button btn-remove class', () => {
        const card = makeSongCard(BASE_SONG, 'Remove', jest.fn());
        expect(card.querySelector('button').className).toBe('btn-remove');
    });

    test('TC-F-007: Subscribe label gives button btn-add class', () => {
        const card = makeSongCard(BASE_SONG, 'Subscribe', jest.fn());
        expect(card.querySelector('button').className).toBe('btn-add');
    });

    test('TC-F-008: Subscribed label gives button btn-add class (not Remove)', () => {
        const card = makeSongCard(BASE_SONG, 'Subscribed', jest.fn());
        expect(card.querySelector('button').className).toBe('btn-add');
    });

    test('TC-F-009: image hidden when no img_url or image_url', () => {
        const song = { ...BASE_SONG, img_url: undefined };
        const card = makeSongCard(song, 'Subscribe', jest.fn());
        expect(card.querySelector('img').style.display).toBe('none');
    });

    test('TC-F-009b: image uses image_url as fallback when img_url missing', () => {
        const song = { ...BASE_SONG, img_url: undefined, image_url: 'http://example.com/alt.jpg' };
        const card = makeSongCard(song, 'Subscribe', jest.fn());
        expect(card.querySelector('img').src).toBe('http://example.com/alt.jpg');
        expect(card.querySelector('img').style.display).not.toBe('none');
    });

    test('TC-F-010: button click invokes onAction callback', () => {
        const onAction = jest.fn();
        const card = makeSongCard(BASE_SONG, 'Subscribe', onAction);
        card.querySelector('button').click();
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    test('TC-F-011: img alt is set to song.artist', () => {
        const card = makeSongCard(BASE_SONG, 'Subscribe', jest.fn());
        expect(card.querySelector('img').alt).toBe('Taylor Swift');
    });

    test('TC-F-012: img alt falls back to "artist image" when no artist', () => {
        const song = { title: 'A', album: 'B', year: '2000' };
        const card = makeSongCard(song, 'Subscribe', jest.fn());
        expect(card.querySelector('img').alt).toBe('artist image');
    });
});
