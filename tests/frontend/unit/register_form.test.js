/**
 * Register form tests.
 * Same DOM setup approach as login_form.test.js.
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

function submitRegister(username, email, password) {
    document.getElementById('registerUsername').value = username;
    document.getElementById('registerEmail').value = email;
    document.getElementById('registerPassword').value = password;
    document.getElementById('registerForm').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
    );
}

describe('Register form', () => {
    let alertMock;

    beforeEach(() => {
        sessionStorage.clear();
        setupDOM();
        alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        alertMock.mockRestore();
    });

    test('TC-F-024: shows "Register success!" alert on successful registration', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: true, data: { email: 'new@test.com' } }),
        });

        submitRegister('NewUser', 'new@test.com', 'password123');
        await new Promise(r => setTimeout(r, 50));

        expect(alertMock).toHaveBeenCalledWith('Register success!');
    });

    test('resets form fields on successful registration', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: true }),
        });

        submitRegister('NewUser', 'new@test.com', 'password123');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('registerUsername').value).toBe('');
        expect(document.getElementById('registerEmail').value).toBe('');
        expect(document.getElementById('registerPassword').value).toBe('');
    });

    test('clears error element text on success', async () => {
        document.getElementById('registerError').textContent = 'Previous error';
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: true }),
        });

        submitRegister('NewUser', 'new@test.com', 'password123');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('registerError').textContent).toBe('');
    });

    test('switches back to login view (removes .active class) on success', async () => {
        document.querySelector('.wrapper').classList.add('active');
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: true }),
        });

        submitRegister('NewUser', 'new@test.com', 'password123');
        await new Promise(r => setTimeout(r, 50));

        expect(document.querySelector('.wrapper').classList.contains('active')).toBe(false);
    });

    test('TC-F-023: shows error on duplicate email (409)', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false, error: 'The email already exists' }),
        });

        submitRegister('NewUser', 'existing@test.com', 'password123');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('registerError').textContent).toBe(
            'The email already exists'
        );
        expect(alertMock).not.toHaveBeenCalled();
    });

    test('shows fallback error when server sends no error message', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false }),
        });

        submitRegister('NewUser', 'new@test.com', 'pass');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('registerError').textContent).toBe('Register failed');
    });

    test('shows "Server error" on network failure', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        submitRegister('NewUser', 'new@test.com', 'pass');
        await new Promise(r => setTimeout(r, 50));

        expect(document.getElementById('registerError').textContent).toBe('Server error');
    });

    test('fetch is called with correct username, email, and password', async () => {
        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: false }),
        });

        submitRegister('NewUser', 'new@test.com', 'mypassword');
        await new Promise(r => setTimeout(r, 50));

        const [, options] = global.fetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.user_name).toBe('NewUser');
        expect(body.email).toBe('new@test.com');
        expect(body.password).toBe('mypassword');
    });
});
