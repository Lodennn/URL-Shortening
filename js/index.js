"use strict";

const userForms = document.querySelector(".user-forms");
const inputUsernameSignup = document.querySelector(".input-username--signup");
const inputEmailSignup = document.querySelector(".input-email--signup");
const inputPasswordSignup = document.querySelector(".input-password--signup");
//prettier-ignore
const inputRePasswordSignup = document.querySelector(".input-repassword--signup");
const inputFavSitesSignup = document.querySelector(".input-favsites--signup");
const inputEmailLogin = document.querySelector(".input-email--login");
const inputPasswordLogin = document.querySelector(".input-password--login");
const signupForm = document.querySelector(".user-form--signup");
const loginForm = document.querySelector(".user-form--login");
const closeModalBtn = document.querySelectorAll(".user-form__close");
const casually = document.querySelector(".casually");
const loggedIn = document.querySelector(".logged-in");
const navCTA = document.querySelector(".nav__cta .casually");
const searchBtn = document.querySelector(".search__cta");
const searchForm = document.querySelector(".search__form");
const searchInput = document.querySelector(".search__input");
const searchResults = document.querySelector(".search__results");
const mobNav = document.querySelector(".mob-nav");
const mobNavBtn = document.querySelector(".mob-nav__button");
const navList = document.querySelectorAll(".nav__list--items");
const nav = document.querySelector(".nav");

class User {
  id = String(Date.now()).slice(-5);
  createdAt = new Date();
  searchURLs = [];

  constructor(userName, password, email, favWebsites) {
    this.userName = userName;
    this.password = password;
    this.email = email;
    this.favWebsites = favWebsites;
  }
}

class App {
  users = [];
  MIN_PASSWORD_LENGTH = 8;
  _isValidUser = [...new Set()];
  modalEvent;
  currentUser;
  API_URL = `https://api.shrtco.de/v2/shorten`;
  appSearchURLs = [];

  constructor() {
    if (localStorage.getItem("users")) {
      this.getUsersStorage();
    }

    if (!localStorage.getItem("currentUser")) {
      this.currentUser = this.getCurrentUserStorage();
    } else {
      this._displayNavLoginStatus();
    }

    if (this.currentUser) {
      this.render(searchResults, this.currentUser.searchURLs);
    }

    navCTA.addEventListener("click", this.openModal);

    // prettier-ignore
    closeModalBtn.forEach((btn) => btn.addEventListener("click", this.closeModal));

    signupForm.addEventListener("submit", this.userSignup.bind(this));

    loginForm.addEventListener("submit", this.userLogin.bind(this));

    loggedIn.addEventListener("click", this._logout.bind(this));

    searchForm.addEventListener("submit", this.shortenData.bind(this));

    searchResults.addEventListener("click", this.copyShortenLink.bind(this));

    mobNavBtn.addEventListener("click", this.toggleMobNav);

    navList.forEach((list) => {
      list.addEventListener("click", this.scrollToNavigation);
    });

    nav.addEventListener("mouseover", this.handleHover.bind(0.5));
    nav.addEventListener("mouseout", this.handleHover.bind(1));
  }

  async shortenData(e) {
    try {
      e.preventDefault();

      const query = this.getQuery();

      if (!query) return;

      this._renderSpinner(searchResults);

      const res = await fetch(`${this.API_URL}?url=${query}`);

      const { result } = await res.json();

      const shortenLink = {
        originalLink: result.original_link,
        shortLink: result.full_short_link2,
      };
      if (!this.currentUser) {
        this.appSearchURLs.push(shortenLink);
        this.render(searchResults, this.appSearchURLs);
      } else {
        this.currentUser.searchURLs.push(shortenLink);
        this.setCurrentUserStorage(this.currentUser);
        this.render(searchResults, this.currentUser.searchURLs);
      }
    } catch (err) {
      console.log(err);
      searchInput.classList.add("invalid-input");
      searchInput.classList.remove("valid-input");
    }
  }

  getQuery() {
    const query = searchInput.value;

    const pattern = new RegExp(
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    if (!!pattern.test(query)) {
      searchInput.classList.add("valid-input");
      searchInput.classList.remove("invalid-input");
      return query;
    } else {
      searchInput.classList.add("invalid-input");
      searchInput.classList.remove("valid-input");
    }
  }

  copyShortenLink(e) {
    e.preventDefault();
    const btn = e.target.closest(".search__result--copy");

    if (!btn) return;
    const text = btn.previousElementSibling.textContent;
    navigator.clipboard.writeText(text).then(
      function () {
        console.log("Copying to clipboard was successful!");
      },
      function (err) {
        console.error("Could not copy text: ", err);
      }
    );
    document.querySelectorAll(".search__result--copy").forEach((bt) => {
      bt.classList.remove("copied");
      bt.textContent = "Copy";
      bt.removeAttribute("disabled");
    });

    btn.classList.add("copied");
    btn.textContent = "Copied!";
    btn.setAttribute("disabled", "disabled");
  }

  render(parentEl, data) {
    const markup = this._generateMarkup(data);
    this._clearParentElement(parentEl);
    parentEl.insertAdjacentHTML("afterbegin", markup);
  }

  _generateMarkup(data) {
    return data
      .map((item) => {
        return `
      <li class="search__result">
        <div class="search__result--url">${item.originalLink}</div>
        <div class="search__result--shorten">${item.shortLink}</div>
        <a href="#" class='btn btn--primary rounded--soft search__result--copy'>Copy</a>
      </li>
      `;
      })
      .join("");
  }

  userSignup(e) {
    e.preventDefault();

    this._checkInputs(
      inputUsernameSignup,
      inputEmailSignup,
      inputPasswordSignup,
      inputRePasswordSignup
    );

    this._checkPassword(inputPasswordSignup, inputRePasswordSignup);

    this._isValid(
      inputUsernameSignup,
      inputEmailSignup,
      inputPasswordSignup,
      inputRePasswordSignup
    );

    const status = this._isValidUser.every((inp) => inp);
    if (status) {
      this.createNewUser();

      this._displayNavLoginStatus();

      this.redirect(signupForm, "home", 2000);
    }
  }

  userLogin(e) {
    e.preventDefault();

    this._checkInputs(inputEmailLogin, inputPasswordLogin);

    this._checkPassword(inputPasswordLogin);

    this._isValid(inputEmailLogin, inputPasswordLogin);

    const status = this._isValidUser.every((inp) => inp);
    console.log(status, this.users);
    if (status) {
      const user = this.users.find(
        (user) =>
          user.email === inputEmailLogin.value &&
          user.password === inputPasswordLogin.value
      );

      console.log(user);

      this.setCurrentUserStorage(user);

      this.currentUser = this.getCurrentUserStorage();

      this._displayNavLoginStatus();

      this.redirect(loginForm, "home", 2000);
    }
  }

  createNewUser() {
    const data = [
      inputUsernameSignup.value,
      inputPasswordSignup.value,
      inputEmailSignup.value,
      inputFavSitesSignup.value,
    ];
    const user = new User(...data);

    this.users.push(user);

    this.setUsersStorage();

    this.setCurrentUserStorage(user);

    this.currentUser = this.getCurrentUserStorage();
  }

  _checkInputs(...inputs) {
    inputs.forEach((input) => {
      if (input.value === "") {
        this._insertErrorMsg(input.parentElement, "Please fill out the data");
      } else if (
        input.dataset.secure === "rexCheck" &&
        !input.value.match(`^[a-zA-Z]`)
      ) {
        //prettier-ignore
        this._insertErrorMsg(input.parentElement, "Please enter a valid format");
      } else if (
        input.dataset.secure === "rexCheck" &&
        input.dataset.type === "signup-email" &&
        this.users.find((u) => input.value === u.email)
      ) {
        //prettier-ignore
        this._insertErrorMsg(input.parentElement, "The email address is already exist");
      } else if (
        input.dataset.secure === "rexCheck" &&
        input.dataset.type === "login-email" &&
        !this.users.some((u) => input.value === u.email)
      ) {
        //prettier-ignore
        this._insertErrorMsg(input.parentElement, "The email address doesn't exist");
      } else {
        this._removeErrorMsg(input);
      }
    });
  }

  _checkPassword(...inputs) {
    if (inputs[0].value.length < this.MIN_PASSWORD_LENGTH) {
      //prettier-ignore
      this._insertErrorMsg(inputs[0].parentElement, "Must enter a password more than 8 characters");
    } else if (
      inputs[0].dataset.type === "login-password" &&
      !this.users.some((u) => inputs[0].value === u.password)
    ) {
      //prettier-ignore
      this._insertErrorMsg(inputs[0].parentElement, "The password is wrong!");
    } else if (inputs.length >= 2 && inputs[0].value !== inputs[1].value) {
      //prettier-ignore
      this._insertErrorMsg(inputs[1].parentElement, "Your password doesn't match");
    } else if (inputs.length >= 2) {
      this._removeErrorMsg(inputs[1]);
    }
  }

  _isValid(...inputs) {
    this._isValidUser = [];

    inputs.forEach((inp) => {
      if (
        !inp.nextElementSibling ||
        inp.nextElementSibling.classList.contains("hidden--error")
      ) {
        this._isValidUser.push(true);
      } else {
        this._isValidUser.push(false);
      }
    });
    return this._isValidUser;
  }

  _displayNavLoginStatus() {
    if (localStorage.getItem("currentUser")) {
      this.currentUser = this.getCurrentUserStorage();

      loggedIn.classList.remove("hidden");
      casually.classList.add("hidden");

      loggedIn.querySelector(".username").textContent =
        this.currentUser.userName;
    } else {
      loggedIn.classList.add("hidden");
      casually.classList.remove("hidden");
    }
  }

  _logout(e) {
    userForms.classList.add("hidden");

    const btn = e.target.closest(".logout");
    if (!btn) return;

    localStorage.removeItem("currentUser");

    this._displayNavLoginStatus();

    this._wait(window.location.reload(), 100);
  }

  _insertErrorMsg(parentEl, errorMsg) {
    const parentElement = parentEl.querySelector(".user-form__error");

    parentElement && parentElement.remove();

    const errorMsgMarkup = `<span class="user-form__error hidden--error">${errorMsg}</span>`;
    parentEl.insertAdjacentHTML("beforeend", errorMsgMarkup);

    parentEl
      .querySelector(".user-form__error")
      .classList.remove("hidden--error");
  }

  _removeErrorMsg(input) {
    if (input.nextElementSibling)
      input.nextElementSibling.classList.add("hidden--error");
  }

  redirect(parentEl, page, time) {
    this._renderSpinner(parentEl);
    this._wait(() => {
      window.location.hash = `#${page}`;
      this._clearParentElement(parentEl);
      this.closeModal();
    }, time);
  }

  _renderSpinner(parentEl) {
    const markup = `
    <div class="spinner">
      <img src="images/spinner.svg" alt="" class='img-fluid' />
    </div>`;

    this._clearParentElement(parentEl);
    parentEl.insertAdjacentHTML("afterbegin", markup);
  }

  _wait(fn, time) {
    setTimeout(fn, time);
  }

  _clearParentElement(parentEl) {
    parentEl.innerHTML = "";
  }

  openModal(e) {
    userForms.classList.remove("hidden");
  }

  closeModal(e) {
    userForms.classList.add("hidden");
  }

  setCurrentUserStorage(data) {
    localStorage.setItem("currentUser", JSON.stringify(data));
  }

  setUsersStorage() {
    localStorage.setItem("users", JSON.stringify(this.users));
  }

  getUsersStorage() {
    const data = JSON.parse(localStorage.getItem("users"));
    this.users = data;
  }

  getCurrentUserStorage() {
    return JSON.parse(localStorage.getItem("currentUser"));
  }

  toggleMobNav() {
    mobNav.classList.toggle("mob-nav--hidden");
  }

  scrollToNavigation(e) {
    e.preventDefault();
    if (e.target.tagName === "A") {
      const id = e.target.getAttribute("href");
      document.querySelector(id).scrollIntoView({ behavior: "smooth" });
    }
  }

  handleHover(e) {
    if (e.target.classList.contains("nav__link")) {
      const link = e.target;
      const siblings = link
        .closest(".nav__list")
        .querySelectorAll(".nav__link");

      siblings.forEach((el) => {
        if (el !== link) el.style.opacity = this;
      });
    }
  }
}

const app = new App();
