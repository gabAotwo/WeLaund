<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avail as Owner — WeLaund</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/landing.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #0c1445 0%, #0c4a6e 50%, #0f172a 100%); min-height: 100vh; }

        .rq-card {
            background: rgba(10,20,50,0.72);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 1.5rem;
            padding: 2.5rem;
        }

        .rq-label { color: rgba(255,255,255,0.6); font-size: .82rem; font-weight: 600; margin-bottom: .4rem; letter-spacing: .4px; text-transform: uppercase; }

        .rq-input {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: .75rem;
            color: #fff;
            padding: .75rem 1rem;
            width: 100%;
            font-size: .95rem;
            transition: border-color .2s, background .2s;
        }
        .rq-input:focus { outline: none; border-color: rgba(14,165,233,0.6); background: rgba(255,255,255,0.09); }
        .rq-input::placeholder { color: rgba(255,255,255,0.25); }
        textarea.rq-input { resize: vertical; min-height: 100px; }

        .rq-btn {
            background: linear-gradient(135deg, #0ea5e9, #0056b3);
            border: none; border-radius: .75rem;
            color: #fff; font-weight: 700; font-size: 1rem;
            padding: .85rem 2rem; width: 100%;
            transition: opacity .2s, transform .15s;
            cursor: pointer;
        }
        .rq-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .rq-btn:disabled { opacity: .5; cursor: not-allowed; }

        .rq-alert { border-radius: .75rem; padding: .85rem 1.1rem; font-size: .9rem; display: none; }
        .rq-alert.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .rq-alert.error   { background: rgba(239,68,68,0.15);  border: 1px solid rgba(239,68,68,0.3);  color: #f87171; }
    </style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar wl-navbar fixed-top">
    <div class="container">
        <a class="navbar-brand wl-brand" href="landing.php">
            <i class="bi bi-droplet-fill me-2"></i>WeLaund
        </a>
        <a href="landing.php" class="btn wl-btn-glass px-4" style="font-size:.85rem;">
            <i class="bi bi-arrow-left me-1"></i> Back
        </a>
    </div>
</nav>

<!-- Form -->
<div class="container" style="padding-top: 100px; padding-bottom: 60px;">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">

            <div class="text-center mb-4">
                <span class="wl-slide-badge">B2B Partnership</span>
                <h1 class="wl-slide-title mt-3" style="font-size:clamp(1.8rem,4vw,2.6rem);">
                    Avail Now as <span class="wl-gradient-text">Owner</span>
                </h1>
                <p class="wl-slide-sub" style="font-size:.95rem;">
                    Fill out the form below. Our team will review your application and send your login credentials once approved.
                </p>
            </div>

            <div class="rq-card">
                <div id="rqAlert" class="rq-alert mb-4"></div>

                <form id="requestForm" novalidate>
                    <div class="mb-4">
                        <label class="rq-label">Full Name <span style="color:#f87171">*</span></label>
                        <input type="text" name="owner_name" class="rq-input" placeholder="e.g. Juan dela Cruz" required>
                    </div>
                    <div class="mb-4">
                        <label class="rq-label">Email Address <span style="color:#f87171">*</span></label>
                        <input type="email" name="email" class="rq-input" placeholder="you@example.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="rq-label">Phone Number <span style="color:#f87171">*</span></label>
                        <input type="tel" name="phone" class="rq-input" placeholder="e.g. 09171234567" required>
                    </div>
                    <div class="mb-4">
                        <label class="rq-label">Laundry Shop Name <span style="color:#f87171">*</span></label>
                        <input type="text" name="shop_name" class="rq-input" placeholder="e.g. Sunshine Laundry Hub" required>
                    </div>
                    <div class="mb-4">
                        <label class="rq-label">Shop Description</label>
                        <textarea name="shop_description" class="rq-input" placeholder="Brief overview of your business (optional)"></textarea>
                    </div>

                    <button type="submit" class="rq-btn" id="submitBtn">
                        <i class="bi bi-send-fill me-2"></i>Submit Application
                    </button>
                </form>
            </div>

        </div>
    </div>
</div>

<script>
document.getElementById('requestForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn   = document.getElementById('submitBtn');
    const alert = document.getElementById('rqAlert');
    const form  = e.target;

    const data = {
        owner_name:       form.owner_name.value.trim(),
        email:            form.email.value.trim(),
        phone:            form.phone.value.trim(),
        shop_name:        form.shop_name.value.trim(),
        shop_description: form.shop_description.value.trim(),
    };

    if (!data.owner_name || !data.email || !data.phone || !data.shop_name) {
        showAlert('error', 'Please fill in all required fields.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

    try {
        const res  = await fetch('/backend/api/public/submit_request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();

        if (json.success) {
            showAlert('success', json.message);
            form.reset();
            btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Application Submitted!';
        } else {
            showAlert('error', json.message || 'Submission failed. Please try again.');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send-fill me-2"></i>Submit Application';
        }
    } catch {
        showAlert('error', 'Network error. Please check your connection and try again.');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-fill me-2"></i>Submit Application';
    }
});

function showAlert(type, message) {
    const el = document.getElementById('rqAlert');
    el.className = 'rq-alert mb-4 ' + type;
    el.textContent = message;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
