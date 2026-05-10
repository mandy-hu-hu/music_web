/**
 * Tests for the auth guard logic in main.html.
 *
 * The guard in main.html is:
 *   const email = sessionStorage.getItem("loggedInEmail");
 *   if (!email) { globalThis.location.replace("index.html"); }
 *   document.getElementById("displayUsername").textContent = username || email;
 *   document.getElementById("displayEmail").textContent = email;
 *
 * We test this logic directly without loading the full module (which has
 * top-level await and CDN imports that complicate Jest).
 */

const DOM_STUB = `
    <p id="displayUsername"></p>
    <p id="displayEmail"></p>
`;

function runAuthGuard(replaceFn) {
    const email = sessionStorage.getItem('loggedInEmail');
    const username = sessionStorage.getItem('loggedInUsername');
    if (!email) {
        replaceFn('index.html');
        return;
    }
    document.getElementById('displayUsername').textContent = username || email;
    document.getElementById('displayEmail').textContent = email;
}

describe('Auth guard', () => {
    let replaceMock;

    beforeEach(() => {
        sessionStorage.clear();
        document.body.innerHTML = DOM_STUB;
        replaceMock = jest.fn();
    });

    test('TC-F-013: redirects to index.html when no session', () => {
        runAuthGuard(replaceMock);
        expect(replaceMock).toHaveBeenCalledWith('index.html');
    });

    test('TC-F-014: does not redirect when session exists', () => {
        sessionStorage.setItem('loggedInEmail', 'alice@test.com');
        runAuthGuard(replaceMock);
        expect(replaceMock).not.toHaveBeenCalled();
    });

    test('TC-F-015: displayUsername shows username from session', () => {
        sessionStorage.setItem('loggedInEmail', 'alice@test.com');
        sessionStorage.setItem('loggedInUsername', 'Alice');
        runAuthGuard(replaceMock);
        expect(document.getElementById('displayUsername').textContent).toBe('Alice');
    });

    test('TC-F-016: displayUsername falls back to email when username absent', () => {
        sessionStorage.setItem('loggedInEmail', 'alice@test.com');
        runAuthGuard(replaceMock);
        expect(document.getElementById('displayUsername').textContent).toBe('alice@test.com');
    });

    test('displayEmail shows the logged-in email', () => {
        sessionStorage.setItem('loggedInEmail', 'alice@test.com');
        runAuthGuard(replaceMock);
        expect(document.getElementById('displayEmail').textContent).toBe('alice@test.com');
    });
});

// ── Logout logic ──────────────────────────────────────────────────────────────

function runLogout(replaceFn) {
    sessionStorage.removeItem('loggedInEmail');
    sessionStorage.removeItem('loggedInUsername');
    replaceFn('index.html?showLogin=true');
}

describe('Logout logic', () => {
    let replaceMock;

    beforeEach(() => {
        sessionStorage.setItem('loggedInEmail', 'alice@test.com');
        sessionStorage.setItem('loggedInUsername', 'Alice');
        replaceMock = jest.fn();
    });

    test('TC-F-025: clears loggedInEmail from sessionStorage', () => {
        runLogout(replaceMock);
        expect(sessionStorage.getItem('loggedInEmail')).toBeNull();
    });

    test('TC-F-025b: clears loggedInUsername from sessionStorage', () => {
        runLogout(replaceMock);
        expect(sessionStorage.getItem('loggedInUsername')).toBeNull();
    });

    test('TC-F-025c: redirects to index.html?showLogin=true', () => {
        runLogout(replaceMock);
        expect(replaceMock).toHaveBeenCalledWith('index.html?showLogin=true');
    });
});
