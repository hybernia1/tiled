import * as Phaser from "phaser";
import { API_BASE_URL, setSessionToken } from "../state/gameState.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthScene extends Phaser.Scene {
  constructor() {
    super("auth");
    this.mode = "login";
    this.formWrapper = null;
  }

  create() {
    const appRoot = document.getElementById("app");
    if (!appRoot) {
      this.scene.start("menu");
      return;
    }

    this.formWrapper = document.createElement("div");
    this.formWrapper.className = "auth-overlay";
    this.formWrapper.innerHTML = `
      <div class="auth-panel">
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Log in or create a new account to begin.</p>
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab is-active" type="button" data-mode="login" role="tab">Login</button>
          <button class="auth-tab" type="button" data-mode="register" role="tab">Register</button>
        </div>
        <form class="auth-form" novalidate>
          <label class="auth-field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" placeholder="you@example.com" />
            <span class="auth-error" data-error="email"></span>
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" placeholder="At least 6 characters" />
            <span class="auth-error" data-error="password"></span>
          </label>
          <button class="auth-submit" type="submit">Login</button>
          <p class="auth-status" aria-live="polite"></p>
        </form>
        <button class="auth-back" type="button">Back to menu</button>
      </div>
    `;

    appRoot.appendChild(this.formWrapper);

    const title = this.formWrapper.querySelector(".auth-title");
    const subtitle = this.formWrapper.querySelector(".auth-subtitle");
    const form = this.formWrapper.querySelector(".auth-form");
    const emailInput = this.formWrapper.querySelector("input[name='email']");
    const passwordInput = this.formWrapper.querySelector("input[name='password']");
    const submitButton = this.formWrapper.querySelector(".auth-submit");
    const status = this.formWrapper.querySelector(".auth-status");
    const backButton = this.formWrapper.querySelector(".auth-back");
    const tabs = Array.from(this.formWrapper.querySelectorAll(".auth-tab"));

    const setMode = (mode) => {
      this.mode = mode;
      tabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.mode === mode);
      });
      if (mode === "register") {
        title.textContent = "Create your account";
        subtitle.textContent = "Register with your email and a secure password.";
        submitButton.textContent = "Register";
        passwordInput.autocomplete = "new-password";
      } else {
        title.textContent = "Welcome back";
        subtitle.textContent = "Log in to continue your adventure.";
        submitButton.textContent = "Login";
        passwordInput.autocomplete = "current-password";
      }
      clearErrors();
      status.textContent = "";
    };

    const clearErrors = () => {
      this.formWrapper
        .querySelectorAll(".auth-error")
        .forEach((el) => (el.textContent = ""));
    };

    const setError = (field, message) => {
      const errorEl = this.formWrapper.querySelector(`[data-error="${field}"]`);
      if (errorEl) {
        errorEl.textContent = message;
      }
    };

    const validate = (email, password) => {
      clearErrors();
      let valid = true;
      if (!email) {
        setError("email", "Email is required.");
        valid = false;
      } else if (!EMAIL_PATTERN.test(email)) {
        setError("email", "Enter a valid email address.");
        valid = false;
      }
      if (!password) {
        setError("password", "Password is required.");
        valid = false;
      } else if (password.length < 6) {
        setError("password", "Password must be at least 6 characters.");
        valid = false;
      }
      return valid;
    };

    const setLoading = (loading) => {
      submitButton.disabled = loading;
      emailInput.disabled = loading;
      passwordInput.disabled = loading;
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!validate(email, password)) {
        return;
      }
      setLoading(true);
      status.textContent =
        this.mode === "register" ? "Creating your account..." : "Logging you in...";
      try {
        const response = await fetch(`${API_BASE_URL}/auth/${this.mode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          status.textContent = payload?.error ?? "Authentication failed.";
          setLoading(false);
          return;
        }
        const token = payload?.token;
        if (!token) {
          status.textContent = "Missing session token.";
          setLoading(false);
          return;
        }
        setSessionToken(token);
        this.registry.set("sessionToken", token);
        status.textContent = "Authenticated! Preparing your hero...";
        this.time.delayedCall(400, () => {
          this.scene.start("world");
        });
      } catch (error) {
        status.textContent = "Network error. Please try again.";
        setLoading(false);
      }
    });

    backButton.addEventListener("click", () => this.scene.start("menu"));

    this.events.once("shutdown", () => {
      this.formWrapper?.remove();
      this.formWrapper = null;
    });
  }
}
