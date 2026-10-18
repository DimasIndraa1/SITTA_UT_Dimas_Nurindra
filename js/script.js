

document.addEventListener('DOMContentLoaded', () => {
    
    // Tampilkan toast logout jika ada
    if (sessionStorage.getItem('sitta_logout_toast') === '1') {
        sessionStorage.removeItem('sitta_logout_toast');
        setTimeout(() => showToast('success', 'Anda telah logout dari sistem SITTA.'), 100);
    }

    initPasswordToggles();

    syncCustomUsers();

    initAuthSystem();

    highlightCurrentNav();
    initUserProfile();

    initLocalTimeGreeting();
    initLiveClock();

    initDashboardTabs();

    renderDashboardData();

    initTrackingSearch();

    syncCustomBahanAjar();
    initStockFilter();
    initTambahBahanAjar();
    initHapusBahanAjar();
});

function syncCustomUsers() {
    if (typeof dataPengguna === 'undefined') return;

    try {
        const storedUsers = JSON.parse(localStorage.getItem('sitta_custom_users') || '[]');
        storedUsers.forEach(customUser => {
            const exists = dataPengguna.some(u => u.email.toLowerCase() === customUser.email.toLowerCase());
            if (!exists) {
                dataPengguna.push(customUser);
            }
        });
    } catch (err) {
        console.warn('Gagal memuat custom users dari localStorage:', err);
    }
}

function initAuthSystem() {
    const formLogin = document.getElementById('formLogin');
    if (!formLogin) return; 

    const loginView = document.getElementById('loginView');
    const forgotView = document.getElementById('forgotView');
    const registerView = document.getElementById('registerView');

    const btnShowForgot = document.getElementById('btnShowForgot');
    const btnShowRegister = document.getElementById('btnShowRegister');
    const btnsBackToLogin = document.querySelectorAll('.btnBackToLogin');

    const loginAlert = document.getElementById('loginAlert');
    const forgotAlert = document.getElementById('forgotAlert');
    const registerAlert = document.getElementById('registerAlert');

    const showView = (viewToShow) => {
        [loginView, forgotView, registerView].forEach(view => {
            if (view) view.classList.add('hidden-view');
        });
        if (viewToShow) viewToShow.classList.remove('hidden-view');
        clearAlerts();
    };

    const clearAlerts = () => {
        [loginAlert, forgotAlert, registerAlert].forEach(el => {
            if (el) {
                el.className = 'alert-feedback';
                el.innerHTML = '';
            }
        });
    };

    const showAlert = (alertEl, type, message) => {
        if (!alertEl) return;
        alertEl.className = `alert-feedback alert-${type}`;
        alertEl.innerHTML = message;
    };

    if (btnShowForgot) {
        btnShowForgot.addEventListener('click', (e) => {
            e.preventDefault();
            showView(forgotView);
        });
    }

    if (btnShowRegister) {
        btnShowRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showView(registerView);
        });
    }

    btnsBackToLogin.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showView(loginView);
        });
    });

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        clearInlineErrors(formLogin);

        const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
        const passwordInput = document.getElementById('loginPassword').value.trim();
        const emailEl = document.getElementById('loginEmail');
        const passEl = document.getElementById('loginPassword');

        let hasError = false;

        if (!emailInput) {
            showInlineError(emailEl, 'Email wajib diisi.');
            hasError = true;
        } else if (!emailInput.includes('@')) {
            showInlineError(emailEl, 'Masukkan alamat email yang valid (harus mengandung @).');
            hasError = true;
        }

        if (!passwordInput) {
            showInlineError(passEl, 'Kata sandi wajib diisi.');
            hasError = true;
        }

        if (hasError) return;

        if (typeof dataPengguna === 'undefined' || !Array.isArray(dataPengguna)) {
            showToast('error', 'Data pengguna tidak ditemukan. Pastikan data.js terpasang dengan benar.');
            return;
        }

        const user = dataPengguna.find(u => u.email.toLowerCase() === emailInput && u.password === passwordInput);

        if (user) {
            showToast('success', `<strong>Login Berhasil!</strong> Selamat datang, ${user.nama} (${user.role}). Mengalihkan ke Dashboard...`);

            sessionStorage.setItem('sitta_logged_in_user', JSON.stringify(user));
            sessionStorage.setItem('sitta_user', user.nama);

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showInlineError(emailEl, 'Email atau password salah.');
            showInlineError(passEl, 'Email atau password salah.');
        }
    });

    const formForgot = document.getElementById('formForgot');
    const forgotResetSection = document.getElementById('forgotResetSection');
    const forgotUserFoundText = document.getElementById('forgotUserFoundText');
    const btnSaveNewPassword = document.getElementById('btnSaveNewPassword');

    let matchedUser = null;

    if (formForgot) {
        formForgot.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgotEmail').value.trim().toLowerCase();

            matchedUser = dataPengguna.find(u => u.email.toLowerCase() === emailInput);

            if (matchedUser) {
                showToast('success', `<strong>Akun Ditemukan!</strong> Nama: ${matchedUser.nama}, Role: ${matchedUser.role} (${matchedUser.lokasi})`);
                
                if (forgotResetSection && forgotUserFoundText) {
                    forgotResetSection.style.display = 'block';
                    forgotUserFoundText.innerHTML = `Kata sandi saat ini: <strong style="color: #004b93; font-size: 1rem;">${matchedUser.password}</strong><br><small style="color: #64748b;">Anda juga dapat mengubahnya ke kata sandi baru di bawah ini:</small>`;
                }
            } else {
                if (forgotResetSection) forgotResetSection.style.display = 'none';
                showToast('error', `Email ${emailInput} tidak terdaftar dalam sistem SITTA.`);
            }
        });
    }

    if (btnSaveNewPassword) {
        btnSaveNewPassword.addEventListener('click', () => {
            const newPassword = document.getElementById('forgotNewPassword').value.trim();
            if (!newPassword) {
                showToast('error', 'Silakan masukkan kata sandi baru.');
                return;
            }

            if (matchedUser) {
                matchedUser.password = newPassword;

                try {
                    let stored = JSON.parse(localStorage.getItem('sitta_custom_users') || '[]');
                    const idx = stored.findIndex(u => u.email.toLowerCase() === matchedUser.email.toLowerCase());
                    if (idx !== -1) {
                        stored[idx].password = newPassword;
                        localStorage.setItem('sitta_custom_users', JSON.stringify(stored));
                    }
                } catch (e) {}

                showToast('success', `Kata sandi berhasil diperbarui menjadi: <strong>${newPassword}</strong>! Silakan kembali ke menu login.`);
                if (forgotResetSection) forgotResetSection.style.display = 'none';

                document.getElementById('loginEmail').value = matchedUser.email;
                document.getElementById('loginPassword').value = newPassword;
            }
        });
    }

    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            clearInlineErrors(formRegister);

            const nama = document.getElementById('regNama').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const role = document.getElementById('regRole').value;
            const lokasi = document.getElementById('regLokasi').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

            const namaEl = document.getElementById('regNama');
            const emailEl = document.getElementById('regEmail');
            const passEl = document.getElementById('regPassword');
            const confirmEl = document.getElementById('regConfirmPassword');

            let hasError = false;

            if (!nama) {
                showInlineError(namaEl, 'Nama lengkap wajib diisi.');
                hasError = true;
            }
            if (!email) {
                showInlineError(emailEl, 'Email wajib diisi.');
                hasError = true;
            } else if (!email.includes('@')) {
                showInlineError(emailEl, 'Masukkan alamat email yang valid.');
                hasError = true;
            }
            if (!password) {
                showInlineError(passEl, 'Kata sandi wajib diisi.');
                hasError = true;
            }
            if (!confirmPassword) {
                showInlineError(confirmEl, 'Konfirmasi kata sandi wajib diisi.');
                hasError = true;
            }
            if (password && confirmPassword && password !== confirmPassword) {
                showInlineError(confirmEl, 'Konfirmasi kata sandi tidak cocok.');
                hasError = true;
            }

            if (hasError) return;

            const alreadyExists = dataPengguna.some(u => u.email.toLowerCase() === email);
            if (alreadyExists) {
                showInlineError(emailEl, `Email <strong>${email}</strong> sudah terdaftar!`);
                showToast('error', `Email ${email} sudah terdaftar! Silakan login atau gunakan email lain.`);
                return;
            }

            const newUser = {
                id: dataPengguna.length + 1,
                nama: nama,
                email: email,
                password: password,
                role: role,
                lokasi: lokasi
            };

            dataPengguna.push(newUser);

            try {
                let stored = JSON.parse(localStorage.getItem('sitta_custom_users') || '[]');
                stored.push(newUser);
                localStorage.setItem('sitta_custom_users', JSON.stringify(stored));
            } catch (err) {
                console.warn('Gagal menyimpan ke localStorage:', err);
            }

            formRegister.reset();

            showView(loginView);
            showToast('success', `<strong>Pendaftaran Berhasil!</strong> Akun untuk <strong>${nama}</strong> (${email}) telah dibuat. Silakan klik Masuk.`);

            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        });
    }
}

function initPasswordToggles() {
    const ICON_EYE = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>';
    const ICON_EYE_OFF = '<path d="M2.1 3.51 3.51 2.1l18.39 18.39-1.41 1.41-3.02-3.02C15.9 19.2 14.06 19.5 12 19.5 7 19.5 2.73 16.39 1 12c.51-1.29 1.3-2.53 2.4-3.6L2.1 3.51zM12 4.5c5 0 9.27 3.11 11 7.5-.75 1.9-2.09 3.6-3.79 4.9l-2.62-2.62A5 5 0 0 0 12 7c-.36 0-.71.04-1.05.11L8.9 4.94C9.9 4.67 10.94 4.5 12 4.5z"/>';

    const resetToggles = () => {
        document.querySelectorAll('[data-password-toggle]').forEach(btn => {
            const input = document.getElementById(btn.getAttribute('data-password-toggle'));
            if (!input) return;
            input.type = 'password';
            btn.classList.remove('is-visible');
            btn.setAttribute('aria-label', 'Tampilkan password');
            const svg = btn.querySelector('svg');
            if (svg) svg.innerHTML = ICON_EYE;
        });
    };

    const applyToggle = (btn) => {
        const input = document.getElementById(btn.getAttribute('data-password-toggle'));
        if (!input) return;

        const isHidden = input.type === 'password';
        input.setAttribute('type', isHidden ? 'text' : 'password');
        btn.classList.toggle('is-visible', isHidden);
        btn.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');

        const svg = btn.querySelector('svg');
        if (svg) svg.innerHTML = isHidden ? ICON_EYE_OFF : ICON_EYE;

        const caret = input.value.length;
        input.focus();
        try { input.setSelectionRange(caret, caret); } catch (err) {  }
    };

    document.querySelectorAll('[data-password-toggle]').forEach(btn => {
        btn.dataset.toggleBound = '1';
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            applyToggle(btn);
        });
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-password-toggle]') : null;
        if (!btn || btn.dataset.toggleBound === '1') return;
        e.preventDefault();
        applyToggle(btn);
    });

    document.querySelectorAll('.auth-view, .auth-view form').forEach(view => {
        view.addEventListener('transitionend', resetToggles);
    });

    const viewSwitchers = ['#btnShowForgot', '#btnShowRegister', '.btnBackToLogin'];
    viewSwitchers.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('click', resetToggles);
        });
    });
}

function fillDemo(email, password) {
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    if (emailField && passwordField) {
        emailField.value = email;
        passwordField.value = password;
        emailField.focus();
    }
}

function initLocalTimeGreeting() {
    const greetingTextEl = document.getElementById('greetingText');
    const greetingIconEl = document.getElementById('greetingIcon');
    if (!greetingTextEl) return;

    const now = new Date();
    const hour = now.getHours();

    let greeting = 'Selamat pagi';
    let icon = '🌅';

    if (hour >= 4 && hour < 11) {
        greeting = 'Selamat pagi';
        icon = '🌅';
    } else if (hour >= 11 && hour < 15) {
        greeting = 'Selamat siang';
        icon = '☀';
    } else if (hour >= 15 && hour < 18) {
        greeting = 'Selamat sore';
        icon = '🌇';
    } else {
        greeting = 'Selamat malam';
        icon = '🌙';
    }

    greetingTextEl.textContent = greeting;
    if (greetingIconEl) greetingIconEl.innerHTML = icon;
}

function initLiveClock() {
    const clockEl = document.getElementById('liveLocalClock');
    if (!clockEl) return;

    const updateClock = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds} WIB`;
    };

    updateClock();
    setInterval(updateClock, 1000);
}

function initUserProfile() {
    const userJson = sessionStorage.getItem('sitta_logged_in_user');
    const greetingUserDisplay = document.getElementById('greetingUserDisplay');
    const greetingRoleMeta = document.getElementById('greetingRoleMeta');
    const statLokasiUser = document.getElementById('statLokasiUser');
    const statLokasiDesc = document.getElementById('statLokasiDesc');

    if (!userJson) {
        
        if (greetingUserDisplay) greetingUserDisplay.textContent = ', Tamu (Guest)';
        return;
    }

    try {
        const user = JSON.parse(userJson);
        if (greetingUserDisplay) {
            greetingUserDisplay.textContent = `, ${user.nama}`;
        }
        if (greetingRoleMeta) {
            greetingRoleMeta.innerHTML = `&bull; Role: <strong>${user.role}</strong> &bull; Wilayah: <strong>${user.lokasi}</strong>`;
        }
        if (statLokasiUser) {
            statLokasiUser.textContent = user.lokasi || 'UPBJJ Jakarta';
        }
        if (statLokasiDesc) {
            statLokasiDesc.textContent = `Login: ${user.email} (${user.role})`;
        }
    } catch (e) {
        console.warn('Gagal memuat profil pengguna:', e);
    }
}

function initDashboardTabs() {
    window.switchDashboardTab = function(tabId) {
        const tabs = document.querySelectorAll('.dashboard-tab-content');
        if (tabs.length === 0) return;

        tabs.forEach(tab => tab.classList.remove('active-tab'));

        const target = document.getElementById(tabId);
        if (target) {
            target.classList.add('active-tab');
        }

        const navDropdown = document.getElementById('navDropdownLaporan');
        if (tabId === 'tabMonitoringDO' || tabId === 'tabRekapBahanAjar') {
            if (navDropdown) navDropdown.classList.add('highlight-active');
        } else {
            if (navDropdown) navDropdown.classList.remove('highlight-active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUrlHash = () => {
        const hash = window.location.hash;
        if (hash === '#monitoring-do') {
            window.switchDashboardTab('tabMonitoringDO');
        } else if (hash === '#rekap-stok') {
            window.switchDashboardTab('tabRekapBahanAjar');
        } else if (hash === '#histori-transaksi') {
            window.switchDashboardTab('tabHistoriTransaksi');
        } else {
            const tabOverview = document.getElementById('tabOverview');
            if (tabOverview) window.switchDashboardTab('tabOverview');
        }
    };

    window.addEventListener('hashchange', handleUrlHash);
    handleUrlHash();

    document.querySelectorAll('.dropdown-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parent = btn.closest('.dropdown');
            document.querySelectorAll('.dropdown').forEach(d => {
                if (d !== parent) d.classList.remove('open');
            });
            if (parent) parent.classList.toggle('open');
        });
    });

    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    });
}

function renderDashboardData() {

    if (typeof dataBahanAjar !== 'undefined' && Array.isArray(dataBahanAjar)) {
        const totalJudul = dataBahanAjar.length;
        const totalStok = dataBahanAjar.reduce((sum, item) => sum + (item.stok || 0), 0);

        const statTotalJudul = document.getElementById('statTotalJudul');
        const statTotalStok = document.getElementById('statTotalStok');
        const rekapTotalEksemplar = document.getElementById('rekapTotalEksemplar');

        if (statTotalJudul) statTotalJudul.textContent = totalJudul;
        if (statTotalStok) statTotalStok.textContent = totalStok.toLocaleString('id-ID');
        if (rekapTotalEksemplar) rekapTotalEksemplar.textContent = `${totalStok.toLocaleString('id-ID')} eks`;

        const overviewBahanAjarTbody = document.getElementById('overviewBahanAjarTableBody');
        if (overviewBahanAjarTbody) {
            overviewBahanAjarTbody.innerHTML = dataBahanAjar.map(item => `
                <tr>
                    <td style="text-align: center;">
                        <img 
                            src="${item.cover}" 
                            alt="${item.namaBarang}" 
                            class="table-cover-thumb" 
                            onclick="showCoverModal('${item.cover}', '${item.namaBarang}')" 
                            title="Klik untuk memperbesar cover"
                        >
                    </td>
                    <td onclick="showPeragaanModal('${item.kodeBarang}')" style="cursor: pointer; color: var(--primary-color); text-decoration: underline;"><strong>${item.kodeBarang}</strong></td>
                    <td>${item.namaBarang}</td>
                    <td><span class="badge badge-info">${item.jenisBarang}</span></td>
                    <td>Ed. ${item.edisi}</td>
                    <td>${item.kodeLokasi}</td>
                    <td><strong>${item.stok.toLocaleString('id-ID')} eks</strong></td>
                    <td>
                        <span class="badge ${item.stok > 200 ? 'badge-success' : 'badge-warning'}">
                            ${item.stok > 200 ? 'Tersedia' : 'Stok Menipis'}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="btn-cta-blue" onclick="showPeragaanModal('${item.kodeBarang}')" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; white-space: nowrap;">
                            &#128214; Peragaan
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const rekapBahanAjarTbody = document.getElementById('rekapBahanAjarTableBody');
        if (rekapBahanAjarTbody) {
            rekapBahanAjarTbody.innerHTML = dataBahanAjar.map((item, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${item.kodeLokasi}</td>
                    <td onclick="showPeragaanModal('${item.kodeBarang}')" style="cursor: pointer; color: var(--primary-color); text-decoration: underline;"><strong>${item.kodeBarang}</strong></td>
                    <td>${item.namaBarang}</td>
                    <td>${item.jenisBarang}</td>
                    <td>Ed. ${item.edisi}</td>
                    <td><strong style="color: var(--primary-color);">${item.stok.toLocaleString('id-ID')} eks</strong></td>
                    <td>
                        <span class="badge ${item.stok > 250 ? 'badge-success' : (item.stok > 100 ? 'badge-warning' : 'badge-danger')}">
                            ${item.stok > 250 ? 'Sangat Aman' : (item.stok > 100 ? 'Tersedia' : 'Perlu Cetak')}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }

    if (typeof dataTracking !== 'undefined') {
        const doKeys = Object.keys(dataTracking);
        const statPaketKirim = document.getElementById('statPaketKirim');
        if (statPaketKirim) statPaketKirim.textContent = doKeys.length;

        const overviewDOTbody = document.getElementById('overviewDOTableBody');
        if (overviewDOTbody) {
            overviewDOTbody.innerHTML = doKeys.map(key => {
                const item = dataTracking[key];
                const isDelivered = item.status.toLowerCase().includes('selesai') || item.status.toLowerCase().includes('diterima');
                return `
                    <tr>
                        <td><strong>${item.nomorDO || key}</strong></td>
                        <td>${item.nama}</td>
                        <td>${item.ekspedisi}</td>
                        <td>${item.tanggalKirim}</td>
                        <td><strong>${item.total}</strong></td>
                        <td>
                            <span class="badge ${isDelivered ? 'badge-success' : 'badge-warning'}">
                                ${item.status}
                            </span>
                        </td>
                        <td>
                            <button type="button" class="btn-export" onclick="showDODetail('${key}')" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">
                                Detail
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        const fullMonitoringDOTbody = document.getElementById('fullMonitoringDOTableBody');
        if (fullMonitoringDOTbody) {
            fullMonitoringDOTbody.innerHTML = doKeys.map(key => {
                const item = dataTracking[key];
                const isCompleted = item.status === 'Dikirim' && item.perjalanan.length >= 5;
                const percent = isCompleted ? 100 : 70;
                const progressClass = isCompleted ? 'success' : 'warning';

                return `
                    <tr>
                        <td><strong style="color: var(--primary-color);">${item.nomorDO || key}</strong></td>
                        <td><strong>${item.nama}</strong></td>
                        <td><code>${item.paket}</code></td>
                        <td>${item.ekspedisi}</td>
                        <td>${item.tanggalKirim}</td>
                        <td><strong>${item.total}</strong></td>
                        <td style="min-width: 200px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 2px;">
                                <span>${item.status}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="progress-bar-wrap">
                                <div class="progress-bar-fill ${progressClass}" style="width: ${percent}%;"></div>
                            </div>
                            <small style="color: var(--text-muted); font-size: 0.75rem;">
                                ${item.perjalanan[item.perjalanan.length - 1].keterangan.slice(0, 38)}...
                            </small>
                        </td>
                        <td>
                            <button type="button" class="btn-primary" onclick="showDODetail('${key}')" style="width: auto; padding: 0.35rem 0.85rem; font-size: 0.82rem;">
                                Lacak DO
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        const historiTransaksiTbody = document.getElementById('historiTransaksiTableBody');
        if (historiTransaksiTbody) {
            historiTransaksiTbody.innerHTML = doKeys.map(key => {
                const item = dataTracking[key];
                const lastLog = item.perjalanan[item.perjalanan.length - 1];
                return `
                    <tr>
                        <td><strong>${item.nomorDO || key}</strong></td>
                        <td>${item.nama}</td>
                        <td>${item.tanggalKirim}</td>
                        <td><span class="badge badge-info">${item.ekspedisi}</span></td>
                        <td><code>${item.paket}</code></td>
                        <td><strong>${item.total}</strong></td>
                        <td>
                            <span class="badge ${item.status === 'Dalam Perjalanan' ? 'badge-warning' : 'badge-success'}">
                                ${item.status}
                            </span>
                        </td>
                        <td><small style="color: var(--text-secondary);">${lastLog.keterangan}</small></td>
                    </tr>
                `;
            }).join('');
        }
    }

    const dashboardSearchInput = document.getElementById('dashboardSearchInput');
    if (dashboardSearchInput) {
        dashboardSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            const overviewDOTbody = document.getElementById('overviewDOTableBody');
            if (overviewDOTbody) {
                const rows = overviewDOTbody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    const rowText = rows[i].textContent.toLowerCase();
                    rows[i].style.display = rowText.includes(query) ? '' : 'none';
                }
            }

            const overviewBahanAjarTbody = document.getElementById('overviewBahanAjarTableBody');
            if (overviewBahanAjarTbody) {
                const rows = overviewBahanAjarTbody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    const rowText = rows[i].textContent.toLowerCase();
                    rows[i].style.display = rowText.includes(query) ? '' : 'none';
                }
            }
        });
    }
}

function isOrderDelivered(item) {
    const status = (item.status || '').toLowerCase();
    if (status.includes('selesai') || status.includes('diterima')) return true;
    if (Array.isArray(item.perjalanan) && item.perjalanan.length > 0) {
        const lastStep = (item.perjalanan[item.perjalanan.length - 1].keterangan || '').toLowerCase();
        return lastStep.includes('selesai antar') || lastStep.includes('diterima');
    }
    return false;
}

function paketDiterimaPreviewHtml(item) {
    if (!isOrderDelivered(item)) return '';
    return `
        <div style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; max-width: fit-content; font-size: 0.82rem;">
            <button type="button" onclick="showCoverModal('assets/img/paket diterima.jpg', 'Bukti Penerimaan Paket')" style="background:#166534;color:#fff;border:none;border-radius:4px;padding:0.3rem 0.75rem;font-size:0.82rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:0.25rem;">
                &#128065; Lihat Bukti Penerimaan Paket
            </button>
            <span style="color:#166534;">Paket telah diterima oleh penerima.</span>
        </div>
    `;
}

window.showDODetail = function(nomorDO) {
    if (typeof dataTracking === 'undefined') return;

    let item = dataTracking[nomorDO];
    if (!item) {
        const key = Object.keys(dataTracking).find(k => k === nomorDO || dataTracking[k].nomorDO === nomorDO);
        if (key) item = dataTracking[key];
    }
    if (!item) return;

    const modal = document.getElementById('modalDODetail');
    const modalTitle = document.getElementById('modalDOTitle');
    const modalContent = document.getElementById('modalDOContent');

    if (!modal || !modalContent) return;

    modalTitle.innerHTML = `Laporan DO: <strong>${item.nomorDO || nomorDO}</strong>`;
    modalContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.5rem; background: var(--bg-page); padding: 1rem; border-radius: var(--radius-md);">
            <div><span style="font-size: 0.8rem; color: var(--text-muted);">Penerima:</span><div style="font-weight: 600;">${item.nama}</div></div>
            <div><span style="font-size: 0.8rem; color: var(--text-muted);">Status Terakhir:</span><div><span class="badge badge-warning">${item.status}</span></div></div>
            <div><span style="font-size: 0.8rem; color: var(--text-muted);">Ekspedisi:</span><div style="font-weight: 600;">${item.ekspedisi}</div></div>
            <div><span style="font-size: 0.8rem; color: var(--text-muted);">Total Tagihan:</span><div style="font-weight: 600;">${item.total}</div></div>
        </div>
        <h4 style="font-size: 0.95rem; margin-bottom: 1rem; color: var(--dark-blue);">Riwayat Lintasan Pengiriman:</h4>
        <div class="timeline" style="margin-left: 0.5rem;">
            ${item.perjalanan.map((step, idx) => `
                <div class="timeline-item ${idx === item.perjalanan.length - 1 ? 'active' : 'completed'}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <h4>${step.keterangan}</h4>
                        <div class="timeline-date">${step.waktu}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${paketDiterimaPreviewHtml(item)}
    `;

    modal.style.display = 'flex';
};

window.closeModalDO = function() {
    const modal = document.getElementById('modalDODetail');
    if (modal) modal.style.display = 'none';
};

function highlightCurrentNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a.nav-item-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const logoutBtn = document.querySelector('.main-nav a.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('sitta_logged_in_user');
            sessionStorage.removeItem('sitta_user');
        });
    }
}

function initTrackingSearch() {
    const trackingBtn = document.getElementById('btnSearchTracking');
    const trackingInput = document.getElementById('trackingNumber');
    const resultCard = document.getElementById('trackingResult');

    if (!trackingBtn || !trackingInput) return;

    const performSearch = () => {
        const query = trackingInput.value.trim();
        if (query === '') {
            showInlineError(trackingInput, 'Silakan masukkan Nomor DO atau Nomor Resi pengiriman.');
            showToast('error', 'Masukkan nomor pengiriman terlebih dahulu.');
            return;
        }

        if (typeof dataTracking === 'undefined') return;

        let item = dataTracking[query];
        if (!item) {
            const foundKey = Object.keys(dataTracking).find(k => 
                k === query || 
                dataTracking[k].nomorDO === query ||
                dataTracking[k].nama.toLowerCase().includes(query.toLowerCase())
            );
            if (foundKey) item = dataTracking[foundKey];
        }

        if (!item) {
            showInlineError(trackingInput, `Nomor "${query}" tidak ditemukan. Contoh: 2023001234 atau 2023005678.`);
            showToast('error', `Nomor DO / Pengiriman "${query}" tidak ditemukan.`);
            return;
        }

        // Hapus inline error jika berhasil
        trackingInput.classList.remove('input-error');
        const err = trackingInput.parentElement.querySelector('.inline-error');
        if (err) err.remove();

        const trackNama = document.getElementById('trackNamaMahasiswa');
        const trackNomor = document.getElementById('trackNomorDO');
        const trackEkspedisi = document.getElementById('trackEkspedisi');
        const trackTanggal = document.getElementById('trackTanggal');

        if (trackNama) trackNama.textContent = item.nama;
        if (trackNomor) trackNomor.textContent = `No. DO: ${item.nomorDO || query}`;
        if (trackEkspedisi) trackEkspedisi.innerHTML = `Ekspedisi: <strong>${item.ekspedisi}</strong> &bull; Paket: <strong>${item.paket}</strong>`;
        if (trackTanggal) trackTanggal.innerHTML = `Tgl: <strong>${item.tanggalKirim}</strong> &bull; Total: <strong>${item.total}</strong>`;

        const timelineContainer = document.getElementById('trackingTimelineContainer');
        if (timelineContainer && Array.isArray(item.perjalanan)) {
            
            const logs = [...item.perjalanan].reverse();

            timelineContainer.innerHTML = logs.map((step, idx) => {
                let mainDesc = step.keterangan;
                let subDesc = '';
                let bukitBox = '';

                if (step.keterangan.includes('. Penerima:')) {
                    const parts = step.keterangan.split('. Penerima:');
                    mainDesc = parts[0];
                    subDesc = 'Penerima: ' + parts[1].trim();
                    if (isOrderDelivered(item)) {
                        bukitBox = paketDiterimaPreviewHtml(item);
                    }
                } else if (step.keterangan.includes('. Pengirim:')) {
                    const parts = step.keterangan.split('. Pengirim:');
                    mainDesc = parts[0];
                    subDesc = 'Pengirim: ' + parts[1].trim();
                }

                return `
                    <div class="tracking-step-item ${idx === 0 ? 'completed' : ''}">
                        <div class="tracking-step-dot"></div>
                        <div class="tracking-step-content">
                            <div class="tracking-step-desc">${mainDesc}</div>
                            ${subDesc ? `<div class="tracking-step-subdesc">${subDesc}</div>` : ''}
                        </div>
                        <div class="tracking-step-time">${step.waktu}</div>
                    </div>
                    ${bukitBox}
                `;
            }).join('');
        }

        if (resultCard) {
            resultCard.style.display = 'block';
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    };

    trackingBtn.addEventListener('click', performSearch);

    if (trackingInput.value.trim() !== '') {
        performSearch();
    }
}

function initStockFilter() {
    const stockInput = document.getElementById('stockSearchInput');
    const stockTableBody = document.getElementById('stockTableBody');

    if (!stockTableBody) return;

    window.renderStockTable = function(items) {
        if (!stockTableBody) return;

        if (!items || items.length === 0) {
            stockTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">&#128269;</div>
                        Data bahan ajar tidak ditemukan sesuai kriteria pencarian.
                    </td>
                </tr>
            `;
            return;
        }

        stockTableBody.innerHTML = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td style="text-align: center;">
                    <img
                        src="${resolveCoverSrc(item.cover)}"
                        alt="${item.namaBarang}"
                        class="table-cover-thumb"
                        onclick="showCoverModal(resolveCoverSrc('${item.cover}'), '${item.namaBarang}')"
                        title="Klik untuk memperbesar cover"
                    >
                </td>
                <td>${item.kodeLokasi}</td>
                <td onclick="showPeragaanModal('${item.kodeBarang}')" style="cursor: pointer; color: var(--primary-color); text-decoration: underline;"><strong>${item.kodeBarang}</strong></td>
                <td>${item.namaBarang}</td>
                <td><span class="badge badge-info">${item.jenisBarang}</span></td>
                <td>Ed. ${item.edisi}</td>
                <td><strong style="color: var(--primary-color);">${item.stok.toLocaleString('id-ID')} eks</strong></td>
                <td>
                    <span class="badge ${item.stok > 200 ? 'badge-success' : (item.stok > 0 ? 'badge-warning' : 'badge-danger')}">
                        ${item.stok > 200 ? 'Tersedia' : (item.stok > 0 ? 'Stok Menipis' : 'Habis')}
                    </span>
                </td>
                <td>
                    <div class="table-action-dropdown">
                        <button type="button" class="table-action-dropdown-btn" onclick="toggleTableActionDropdown(event, this)" aria-label="Aksi">
                            &#8942;
                        </button>
                        <div class="table-action-dropdown-menu" id="actionMenu-${item.kodeBarang}">
                            <button type="button" class="table-action-dropdown-item" onclick="showPeragaanModal('${item.kodeBarang}'); closeTableActionDropdowns();">
                                &#128214; Peragaan
                            </button>
                            <button type="button" class="table-action-dropdown-item" onclick="openEditBahanAjarModal('${item.kodeBarang}'); closeTableActionDropdowns();">
                                &#9998; Edit
                            </button>
                            <button type="button" class="table-action-dropdown-item" onclick="openHapusBahanAjarModal('${item.kodeBarang}'); closeTableActionDropdowns();">
                                &#128465; Hapus
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    if (typeof dataBahanAjar !== 'undefined' && Array.isArray(dataBahanAjar)) {
        window.renderStockTable(dataBahanAjar);
    }

    const executeStockSearch = () => {
        if (!stockInput) return;
        const keyword = stockInput.value.toLowerCase().trim();

        if (typeof dataBahanAjar === 'undefined' || !Array.isArray(dataBahanAjar)) return;

        const filtered = dataBahanAjar.filter(item => 
            item.kodeBarang.toLowerCase().includes(keyword) ||
            item.namaBarang.toLowerCase().includes(keyword) ||
            item.jenisBarang.toLowerCase().includes(keyword) ||
            item.kodeLokasi.toLowerCase().includes(keyword) ||
            String(item.edisi).includes(keyword)
        );

        window.renderStockTable(filtered);
    };

    if (stockInput) {
        stockInput.addEventListener('input', executeStockSearch);
    }

    const btnTriggerSearch = document.getElementById('btnTriggerSearch');
    if (btnTriggerSearch) {
        btnTriggerSearch.addEventListener('click', executeStockSearch);
    }
}

const STORAGE_BAHAN_AJAR = 'sitta_custom_bahan_ajar';
const STORAGE_COVER_PREFIX = 'sitta_cover_bahan_ajar_';
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const DEFAULT_COVER = 'assets/img/pengantar_komunikasi.jpg';

function syncCustomBahanAjar() {
    if (typeof dataBahanAjar === 'undefined' || !Array.isArray(dataBahanAjar)) return;

    try {
        const storedItems = JSON.parse(localStorage.getItem(STORAGE_BAHAN_AJAR) || '[]');
        storedItems.forEach(customItem => {
            const exists = dataBahanAjar.some(item => item.kodeBarang === customItem.kodeBarang);
            if (!exists) {
                dataBahanAjar.push({ ...customItem, cover: customItem.cover || DEFAULT_COVER });
            }
        });
    } catch (err) {
        console.warn('Gagal memuat bahan ajar tambahan dari localStorage:', err);
    }
}

function saveCustomBahanAjar(item) {
    try {
        const storedItems = JSON.parse(localStorage.getItem(STORAGE_BAHAN_AJAR) || '[]');
        storedItems.push(item);
        localStorage.setItem(STORAGE_BAHAN_AJAR, JSON.stringify(storedItems));
        return true;
    } catch (err) {
        console.warn('Gagal menyimpan bahan ajar ke localStorage:', err);
        return false;
    }
}

function updateCustomBahanAjar(item) {
    try {
        const storedItems = JSON.parse(localStorage.getItem(STORAGE_BAHAN_AJAR) || '[]');
        const index = storedItems.findIndex(stored => stored.kodeBarang === item.kodeBarang);
        if (index === -1) return false;
        storedItems[index] = item;
        localStorage.setItem(STORAGE_BAHAN_AJAR, JSON.stringify(storedItems));
        return true;
    } catch (err) {
        console.warn('Gagal memperbarui bahan ajar di localStorage:', err);
        return false;
    }
}

function removeCustomBahanAjar(kodeBarang) {
    try {
        const storedItems = JSON.parse(localStorage.getItem(STORAGE_BAHAN_AJAR) || '[]');
        const filtered = storedItems.filter(stored => stored.kodeBarang !== kodeBarang);
        localStorage.setItem(STORAGE_BAHAN_AJAR, JSON.stringify(filtered));
        localStorage.removeItem(STORAGE_COVER_PREFIX + kodeBarang);
    } catch (err) {
        console.warn('Gagal menghapus bahan ajar dari localStorage:', err);
    }
}

function resolveCoverSrc(cover) {
    if (!cover) return DEFAULT_COVER;
    if (cover.indexOf(STORAGE_COVER_PREFIX) === 0) {
        return localStorage.getItem(cover) || DEFAULT_COVER;
    }
    return cover;
}

function initTambahBahanAjar() {
    const btnOpen = document.getElementById('btnTambahBahanAjar');
    const modal = document.getElementById('modalTambahBahanAjar');
    const form = document.getElementById('formTambahBahanAjar');
    const alertBox = document.getElementById('alertTambahBahanAjar');
    const dropzone = document.getElementById('coverDropzone');
    const previewImg = document.getElementById('coverPreviewImg');
    const dropTitle = document.getElementById('coverDropTitle');
    const dropHint = document.getElementById('coverDropHint');
    const clearCoverBtn = document.getElementById('coverClearBtn');

    if (!btnOpen || !modal || !form) return;

    const fields = {
        kodeLokasi: document.getElementById('inputKodeLokasi'),
        kodeBarang: document.getElementById('inputKodeBarang'),
        namaBarang: document.getElementById('inputNamaBarang'),
        jenisBarang: document.getElementById('inputJenisBarang'),
        edisi: document.getElementById('inputEdisi'),
        stok: document.getElementById('inputStokBarang'),
        cover: document.getElementById('inputCoverBarang')
    };

    const showAlert = (type, message) => {
        if (!alertBox) return;
        alertBox.className = message ? `alert-feedback alert-${type}` : 'alert-feedback';
        alertBox.innerHTML = message || '';
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const resetCoverBox = () => {
        if (dropzone) dropzone.classList.remove('is-filled', 'is-error');
        if (previewImg) {
            previewImg.hidden = true;
            previewImg.removeAttribute('src');
        }
        if (dropTitle) dropTitle.textContent = 'Klik untuk memilih gambar cover';
        if (dropHint) dropHint.textContent = 'Format JPG atau PNG, maksimal ukuran 5 MB';
        if (clearCoverBtn) clearCoverBtn.hidden = true;
        if (fields.cover) fields.cover.value = '';
    };

    const showCoverBox = (file) => {
        if (dropzone) dropzone.classList.remove('is-error');
        if (previewImg) {
            previewImg.src = URL.createObjectURL(file);
            previewImg.hidden = false;
        }
        if (dropTitle) dropTitle.textContent = file.name;
        if (dropHint) dropHint.textContent = 'Ukuran ' + formatSize(file.size) + ' - klik untuk mengganti';
        if (clearCoverBtn) clearCoverBtn.hidden = false;
        if (dropzone) dropzone.classList.add('is-filled');
    };

    const         rejectCover = (message) => {
        if (fields.cover) fields.cover.value = '';
        if (previewImg) previewImg.hidden = true;
        if (dropTitle) dropTitle.textContent = 'Klik untuk memilih gambar cover';
        if (dropHint) dropHint.textContent = 'Format JPG atau PNG, maksimal ukuran 5 MB';
        if (clearCoverBtn) clearCoverBtn.hidden = true;
        if (dropzone) {
            dropzone.classList.remove('is-filled');
            dropzone.classList.add('is-error');
        }
        showToast('error', message);
    };

    const handleCoverChange = () => {
        const file = fields.cover && fields.cover.files ? fields.cover.files[0] : null;
        if (!file) {
            resetCoverBox();
            return;
        }

        const allowedType = ['image/jpeg', 'image/png'].indexOf(file.type) !== -1;
        if (!allowedType) {
            rejectCover('Format cover harus JPG atau PNG.');
            return;
        }

        if (file.size > MAX_COVER_SIZE) {
            rejectCover('Ukuran cover maksimal 5 MB. File Anda berukuran ' + formatSize(file.size) + '.');
            return;
        }

        showCoverBox(file);
        showToast('info', '');
    };

    if (dropzone) {
        dropzone.addEventListener('click', () => fields.cover && fields.cover.click());
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!fields.cover.files.length) dropzone.classList.add('is-filled');
        });
        dropzone.addEventListener('dragleave', () => {
            if (!fields.cover.files.length) dropzone.classList.remove('is-filled');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!fields.cover) return;
            fields.cover.files = e.dataTransfer.files;
            handleCoverChange();
        });
    }

    if (clearCoverBtn) {
        clearCoverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetCoverBox();
        });
    }

    if (fields.cover) {
        fields.cover.addEventListener('change', handleCoverChange);
    }

    const clearState = () => {
        form.reset();
        Object.values(fields).forEach(el => el && el.classList.remove('input-error'));
        resetCoverBox();
        showAlert('info', '');
    };

    const modalTitle = document.getElementById('modalTambahTitle');
    const modalSubtitle = document.getElementById('modalTambahSubtitle');
    const modalIcon = document.getElementById('modalTambahIcon');
    const submitBtn = document.getElementById('btnSimpanBahanAjar');
    let editingKodeBarang = null;

    const setModalMode = (isEdit, kodeBarang) => {
        editingKodeBarang = isEdit ? (kodeBarang || null) : null;
        if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Bahan Ajar' : 'Tambah Bahan Ajar';
        if (modalSubtitle) {
            modalSubtitle.textContent = isEdit
                ? 'Perbarui data bahan ajar, lalu simpan perubahan Anda.'
                : 'Lengkapi data bahan ajar baru, cover diunggah pada langkah terakhir.';
        }
        if (modalIcon) modalIcon.innerHTML = isEdit ? '&#9998;' : '&#43;';
        if (submitBtn) submitBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Simpan Bahan Ajar';
        if (fields.kodeBarang) fields.kodeBarang.readOnly = isEdit;
    };

    const showExistingCover = (cover) => {
        if (!cover) return;
        if (dropzone) dropzone.classList.add('is-filled');
        if (previewImg) {
            previewImg.src = resolveCoverSrc(cover);
            previewImg.hidden = false;
        }
        if (dropTitle) dropTitle.textContent = 'Cover saat ini';
        if (dropHint) dropHint.textContent = 'Klik untuk mengganti dengan gambar lain';
    };

    window.openTambahBahanAjarModal = function() {
        clearState();
        setModalMode(false);
        modal.style.display = 'flex';
        if (fields.kodeLokasi) fields.kodeLokasi.focus();
    };

    window.openEditBahanAjarModal = function(kodeBarang) {
        if (typeof dataBahanAjar === 'undefined') return;
        const item = dataBahanAjar.find(row => row.kodeBarang === kodeBarang);
        if (!item) return;

        clearState();
        setModalMode(true, item.kodeBarang);

        fields.kodeLokasi.value = item.kodeLokasi;
        fields.kodeBarang.value = item.kodeBarang;
        fields.namaBarang.value = item.namaBarang;
        fields.jenisBarang.value = item.jenisBarang;
        fields.edisi.value = item.edisi;
        fields.stok.value = item.stok;
        showExistingCover(item.cover);

        modal.style.display = 'flex';
        if (fields.namaBarang) fields.namaBarang.focus();
    };

    window.closeTambahBahanAjarModal = function() {
        modal.style.display = 'none';
        setModalMode(false);
    };

    btnOpen.addEventListener('click', window.openTambahBahanAjarModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        Object.values(fields).forEach(el => el && el.classList.remove('input-error'));
        if (dropzone) dropzone.classList.remove('is-error');

        const isEditMode = editingKodeBarang !== null;
        const kodeLokasi = (fields.kodeLokasi.value || '').trim();
        const kodeBarang = (fields.kodeBarang.value || '').trim().toUpperCase();
        const namaBarang = (fields.namaBarang.value || '').trim();
        const edisi = parseInt(fields.edisi.value, 10);
        const stok = parseInt(fields.stok.value, 10);

        const isDuplicate = typeof dataBahanAjar !== 'undefined'
            && dataBahanAjar.some(item => item.kodeBarang === kodeBarang && item.kodeBarang !== editingKodeBarang);
        
        // Validasi input
        if (!kodeLokasi || !kodeBarang || !namaBarang || Number.isNaN(edisi) || Number.isNaN(stok)) {
            Object.values(fields).forEach(el => el && el.classList.add('input-error'));
            // Inline error messages
            const showFieldError = (el, msg) => {
                if (!el) return;
                el.classList.add('input-error');
                const parent = el.parentElement;
                const existing = parent.querySelector('.inline-error');
                if (existing) existing.remove();
                const err = document.createElement('span');
                err.className = 'inline-error';
                err.textContent = msg;
                parent.appendChild(err);
                el.addEventListener('input', function() {
                    el.classList.remove('input-error');
                    const e = el.parentElement.querySelector('.inline-error');
                    if (e) e.remove();
                }, { once: true });
            };
            if (!kodeLokasi) showFieldError(fields.kodeLokasi, 'Kode Lokasi wajib diisi.');
            if (!kodeBarang) showFieldError(fields.kodeBarang, 'Kode Barang wajib diisi.');
            if (!namaBarang) showFieldError(fields.namaBarang, 'Nama Bahan Ajar wajib diisi.');
            if (Number.isNaN(edisi)) showFieldError(fields.edisi, 'Edisi harus berupa angka.');
            if (Number.isNaN(stok)) showFieldError(fields.stok, 'Jumlah Stok harus berupa angka.');
            return;
        }

        if (edisi < 1 || stok < 0) {
            fields.edisi.classList.add('input-error');
            fields.stok.classList.add('input-error');
            const parentE = fields.edisi.parentElement;
            const existingE = parentE.querySelector('.inline-error');
            if (existingE) existingE.remove();
            const errE = document.createElement('span');
            errE.className = 'inline-error';
            errE.textContent = 'Edisi minimal 1.';
            parentE.appendChild(errE);
            fields.edisi.addEventListener('input', function() {
                fields.edisi.classList.remove('input-error');
                const e = fields.edisi.parentElement.querySelector('.inline-error');
                if (e) e.remove();
            }, { once: true });
            const parentS = fields.stok.parentElement;
            const existingS = parentS.querySelector('.inline-error');
            if (existingS) existingS.remove();
            const errS = document.createElement('span');
            errS.className = 'inline-error';
            errS.textContent = 'Jumlah Stok tidak boleh negatif.';
            parentS.appendChild(errS);
            fields.stok.addEventListener('input', function() {
                fields.stok.classList.remove('input-error');
                const e = fields.stok.parentElement.querySelector('.inline-error');
                if (e) e.remove();
            }, { once: true });
            showToast('error', 'Edisi minimal 1 dan Jumlah Stok tidak boleh negatif.');
            return;
        }

        if (isDuplicate) {
            fields.kodeBarang.classList.add('input-error');
            const parentK = fields.kodeBarang.parentElement;
            const existingK = parentK.querySelector('.inline-error');
            if (existingK) existingK.remove();
            const errK = document.createElement('span');
            errK.className = 'inline-error';
            errK.textContent = `Kode Barang ${kodeBarang} sudah terdaftar.`;
            parentK.appendChild(errK);
            fields.kodeBarang.addEventListener('input', function() {
                fields.kodeBarang.classList.remove('input-error');
                const e = fields.kodeBarang.parentElement.querySelector('.inline-error');
                if (e) e.remove();
            }, { once: true });
            showToast('error', `Kode Barang <strong>${kodeBarang}</strong> sudah terdaftar. Gunakan kode lain.`);
            return;
        }

        const file = fields.cover.files && fields.cover.files[0];
        if (file && file.size > MAX_COVER_SIZE) {
            rejectCover('Ukuran cover maksimal 5 MB. File Anda berukuran ' + formatSize(file.size) + '.');
            return;
        }

        const existingItem = isEditMode && typeof dataBahanAjar !== 'undefined'
            ? dataBahanAjar.find(item => item.kodeBarang === editingKodeBarang)
            : null;

        const newItem = {
            kodeLokasi,
            kodeBarang,
            namaBarang,
            jenisBarang: fields.jenisBarang.value,
            edisi: String(edisi),
            stok,
            cover: (existingItem && existingItem.cover) || DEFAULT_COVER
        };

        const finishForm = () => {
            const stockInput = document.getElementById('stockSearchInput');
            if (stockInput) stockInput.value = '';

            if (isEditMode && existingItem) {
                Object.assign(existingItem, newItem);
                updateCustomBahanAjar(newItem);
            } else {
                if (typeof dataBahanAjar !== 'undefined') dataBahanAjar.push(newItem);
                saveCustomBahanAjar(newItem);
            }

            if (typeof window.renderStockTable === 'function') {
                window.renderStockTable(dataBahanAjar);
            }

            modal.style.display = 'none';
            form.reset();
            resetCoverBox();
            setModalMode(false);
        };

        const applyItem = (cover) => {
            if (cover) newItem.cover = cover;
            finishForm();
        };

        if (!file) {
            applyItem(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                localStorage.setItem(STORAGE_COVER_PREFIX + kodeBarang, reader.result);
                applyItem(STORAGE_COVER_PREFIX + kodeBarang);
            } catch (err) {
                console.warn('Gagal menyimpan cover ke localStorage:', err);
                applyItem(null);
            }
        };
        reader.onerror = () => applyItem(null);
        reader.readAsDataURL(file);
    });
}

function initHapusBahanAjar() {
    const modal = document.getElementById('modalHapusBahanAjar');
    const targetNama = document.getElementById('hapusTargetNama');
    const targetKode = document.getElementById('hapusTargetKode');
    const btnConfirm = document.getElementById('btnKonfirmasiHapus');

    if (!modal || !btnConfirm) return;

    let pendingKode = null;

    window.openHapusBahanAjarModal = function(kodeBarang) {
        if (typeof dataBahanAjar === 'undefined') return;
        const item = dataBahanAjar.find(row => row.kodeBarang === kodeBarang);
        if (!item) return;

        pendingKode = kodeBarang;
        if (targetNama) targetNama.textContent = item.namaBarang;
        if (targetKode) targetKode.textContent = item.kodeBarang;
        modal.style.display = 'flex';
    };

    window.closeHapusBahanAjarModal = function() {
        modal.style.display = 'none';
        pendingKode = null;
    };

    btnConfirm.addEventListener('click', () => {
        if (!pendingKode) return;

        if (typeof dataBahanAjar !== 'undefined') {
            const index = dataBahanAjar.findIndex(item => item.kodeBarang === pendingKode);
            if (index !== -1) dataBahanAjar.splice(index, 1);
        }
        removeCustomBahanAjar(pendingKode);

        if (typeof window.renderStockTable === 'function') {
            window.renderStockTable(dataBahanAjar);
        }

        window.closeHapusBahanAjarModal();
    });
}

window.showCoverModal = function(src, title) {
    const modal = document.getElementById('modalCoverPreview');
    const modalImg = document.getElementById('modalCoverImg');
    const modalTitle = document.getElementById('modalCoverTitle');

    if (modal && modalImg) {
        modalImg.src = src;
        if (modalTitle) modalTitle.textContent = title || 'Cover Bahan Ajar';
        modal.style.display = 'flex';
    }
};

window.closeCoverModal = function() {
    const modal = document.getElementById('modalCoverPreview');
    if (modal) modal.style.display = 'none';
};

window.showPeragaanModal = function(kodeBarang) {
    if (typeof dataBahanAjar === 'undefined') return;
    const item = dataBahanAjar.find(b => b.kodeBarang === kodeBarang);
    if (!item) return;

    const modal = document.getElementById('modalPeragaanDetail');
    const modalCover = document.getElementById('modalPeragaanCover');
    const modalFields = document.getElementById('modalPeragaanFields');

    if (!modal || !modalFields) return;

    if (modalCover) {
        modalCover.src = resolveCoverSrc(item.cover);
        modalCover.alt = item.namaBarang;
    }

    modalFields.innerHTML = `
        <div class="peragaan-field-group">
            <label class="peragaan-label">Kode Lokasi</label>
            <div class="peragaan-value-box">${item.kodeLokasi}</div>
        </div>
        <div class="peragaan-field-group">
            <label class="peragaan-label">Kode Barang</label>
            <div class="peragaan-value-box">${item.kodeBarang}</div>
        </div>
        <div class="peragaan-field-group">
            <label class="peragaan-label">Nama Barang</label>
            <div class="peragaan-value-box">${item.namaBarang}</div>
        </div>
        <div class="peragaan-field-group">
            <label class="peragaan-label">Jenis Barang</label>
            <div class="peragaan-value-box">${item.jenisBarang}</div>
        </div>
        <div class="peragaan-field-group">
            <label class="peragaan-label">Edisi</label>
            <div class="peragaan-value-box">${item.edisi}</div>
        </div>
        <div class="peragaan-field-group">
            <label class="peragaan-label">Stok</label>
            <div class="peragaan-value-box">${item.stok}</div>
        </div>
    `;

    modal.style.display = 'flex';
};

window.closePeragaanModal = function() {
    const modal = document.getElementById('modalPeragaanDetail');
    if (modal) modal.style.display = 'none';
};

window.toggleTableActionDropdown = function(event, btn) {
    event.stopPropagation();
    closeTableActionDropdowns();
    const menu = btn.nextElementSibling;
    if (menu && menu.classList.contains('table-action-dropdown-menu')) {
        menu.classList.remove('drop-up');
        menu.classList.add('open');

        requestAnimationFrame(() => {
            const btnRect = btn.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();

            let scrollContainer = btn;
            while (scrollContainer && scrollContainer !== document.body) {
                const style = window.getComputedStyle(scrollContainer);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    break;
                }
                scrollContainer = scrollContainer.parentElement;
            }

            let spaceBelow;
            if (scrollContainer && scrollContainer !== document.body) {
                const containerRect = scrollContainer.getBoundingClientRect();
                spaceBelow = containerRect.bottom - btnRect.bottom - 8;
            } else {
                spaceBelow = window.innerHeight - btnRect.bottom - 8;
            }

            if (spaceBelow < menuRect.height + 8) {
                menu.classList.add('drop-up');
            }
        });
    }
};

window.closeTableActionDropdowns = function() {
    document.querySelectorAll('.table-action-dropdown-menu.open').forEach((menu) => {
        menu.classList.remove('open', 'drop-up');
    });
};

document.addEventListener('click', closeTableActionDropdowns);

/* Logout toast */
document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.setItem('sitta_logout_toast', '1');
        sessionStorage.removeItem('sitta_logged_in_user');
        sessionStorage.removeItem('sitta_user');
        window.location.href = btn.getAttribute('href') || 'index.html';
    });
});

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
window.showToast = function(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: '&#10004;',
        error: '&#10008;',
        info: '&#9432;'
    };

    toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
        <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
};

/* ==========================================================================
   INLINE ERROR HELPER
   ========================================================================== */
window.showInlineError = function(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('input-error');

    // Hapus inline error lama jika ada
    const existing = inputEl.parentElement.querySelector('.inline-error');
    if (existing) existing.remove();

    const errorEl = document.createElement('span');
    errorEl.className = 'inline-error';
    errorEl.textContent = message;
    inputEl.parentElement.appendChild(errorEl);

    inputEl.addEventListener('input', function clear() {
        inputEl.classList.remove('input-error');
        const err = inputEl.parentElement.querySelector('.inline-error');
        if (err) err.remove();
        inputEl.removeEventListener('input', clear);
    }, { once: true });
};

window.clearInlineErrors = function(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    formEl.querySelectorAll('.inline-error').forEach(el => el.remove());
};


