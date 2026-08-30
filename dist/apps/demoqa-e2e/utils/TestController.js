"use strict";
/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Test registry for the DemoQA e2e suite.
 *              Every spec file must have a corresponding entry here.
 *              Set run: false to temporarily skip a test without deleting it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testControlData = void 0;
exports.testControlData = [
    {
        file: 'apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts',
        run: true,
        location: ['LOCAL', 'GITHUB'],
        sequenceOrder: 1,
        description: 'DemoQA Student Registration Form — TC_001 to TC_020',
    },
];
