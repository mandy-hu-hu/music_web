/**
 * Login form tests.
 * Loads app.js into jsdom after setting up the index.html DOM structure,
 * then dispatches submit events and asserts behavior.
 */

const INDEX_HTML = `
    <button class="btnLogin-popup">Login</button>
    <div class="wrapper">
        <span class="icon-close"></span>
        <a class="register-link" href="#">Register</a>
        <a class="login-link" href="#">Login</a>
        <div class="form-box login">
            <form id="loginForm">
                <input id="loginEmail" type="email" required>
                <input id="loginPassword" type="password" required>
                <p id="loginError"></p>
                <button type="submit">Login</button>
            </form>
        </div>
        <div class="form-box register">
            <form id="registerForm">
                <input id="registerUsername" type="text" required>
                <input id="registerEmail" type="email" required>
                <input id="registerPassword" type="password" required>
                <p id="registerError"></p>
                <button type="submit">Register</button>
            </form>
        </div>
    </div>
`;

function setupDOM() {
    document.body.innerHTML = INDEX_HTML;
    Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: { replace: jest.fn(), search: '' },
    });
    global.fetch = jest.fn();
    jest.isolateModules(() => {
        require('../../../frontend/app.js');
    });
}

function submitLogin(email, password) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
    document.getElementById('loginForm').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
    );
}

describe('Login form', () => {
    beforeEach(() => {
        sessionStorage.clear();
        setupDOM();
    });

    test('TC-F-021: redirects to main.html on successful login', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                ok: true,
                data: { email: 'alice@test.com', user_name: 'Alice' },
            }),
        });

        submitLogin('alice@test.com', 'pass123');
        await new Promise(r => setTimeout(r, 50));

        expect(window.location.replace).toHaveBeenCalledWith('main.html');
    });

    test('TC-F-022: stores email and username in sessionStorage on success', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                ok: true,
                data: { email: 'alice@test.com', user_name: 'Alice' },
            }),
        });

        submitLogin('alice@test.com', 'pass123');
        await new Promise(r => setTimeout(r, 50));

        expect(sessionStorage.getItem('loggedInEmail')).toBe('alice@test.com');
        expect(sessionStorage.getItem('loggedInUsername')).toBe('Alice');
    });

    test('TC-F-020: shows error message on failed login (401)', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                ok: false,
                error: 'email or password is invalid',
            }),
        });

        submitLogin('alice@test.com', 'wrong');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('loginError').textContent).toBe(
            'email or password is invalid'
        );
    });

    test('shows fallback error text when server sends no error message', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false }),
        });

        submitLogin('alice@test.com', 'wrong');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('loginError').textContent).toBe('Login failed');
    });

    test('shows "Server error" on network failure', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        submitLogin('alice@test.com', 'pass123');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('loginError').textContent).toBe('Server error');
    });

    test('does not redirect on failed login', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false, error: 'email or password is invalid' }),
        });

        submitLogin('alice@test.com', 'wrong');
        await new Promise(r => setTimeout(r, 50));

        expect(window.location.replace).not.toHaveBeenCalled();
    });

    test('fetch is called with correct email and password', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false }),
        });

        submitLogin('alice@test.com', 'pass123');
        await new Promise(r => setTimeout(r, 50));

        const [, options] = global.fetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.email).toBe('alice@test.com');
        expect(body.password).toBe('pass123');
    });
});
