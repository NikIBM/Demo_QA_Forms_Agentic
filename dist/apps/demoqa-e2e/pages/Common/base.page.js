"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
class BasePage {
    constructor(page) {
        this.page = page;
    }
    async navigateTo(path) {
        await this.page.goto(path);
    }
}
exports.BasePage = BasePage;
