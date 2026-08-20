/**
 * Browser-bundle smoke tests for the offline Electronics Logic grader.
 */

const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const halfAdder = require('../core/fixtures/circuit-half-adder.json');

describe('Electronics Logic offline grader bundle', () => {
    it('exposes the canonical grader globally and grades without Node globals', async () => {
        global.$electronicsLogicGrader = undefined;
        const bundlePath = join(
            process.cwd(),
            'public/files/perm/idevices/base/electronics-logic/export/electronics-logic-grader.bundle.js',
        );

        await import(`${pathToFileURL(bundlePath).href}?browser-smoke=1`);

        expect(global.$electronicsLogicGrader).toBeDefined();
        const result = global.$electronicsLogicGrader.gradeActivity(
            {
                id: 'offline-exercise',
                type: 'electronics.logic',
                schemaVersion: 1,
                mode: 'boolean',
                prompt: 'Viết biểu thức tương đương.',
                variables: ['A', 'B'],
                authoring: { answerSource: 'expression' },
                answer: { expression: 'A XOR B', minterms: [], dontCares: [] },
                grading: { maxScore: 10 },
                learner: {},
                accessibility: { label: '' },
            },
            { expression: '!A*B+A*!B' },
            { attemptId: 'offline-attempt', createdAt: '2026-08-12T04:00:00.000Z' },
        );

        expect(result).toMatchObject({
            engine: 'electronics-logic-core',
            engineVersion: '0.1.0',
            score: 10,
            maxScore: 10,
        });
    });

    it('grades a Karnaugh response through the rebuilt offline bundle', async () => {
        global.$electronicsLogicGrader = undefined;
        const bundlePath = join(
            process.cwd(),
            'public/files/perm/idevices/base/electronics-logic/export/electronics-logic-grader.bundle.js',
        );

        await import(`${pathToFileURL(bundlePath).href}?browser-smoke=kmap`);

        const result = global.$electronicsLogicGrader.gradeActivity(
            {
                id: 'offline-kmap',
                type: 'electronics.logic',
                schemaVersion: 1,
                mode: 'kmap',
                prompt: 'Hoàn thành bản đồ Karnaugh.',
                variables: ['A', 'B', 'C', 'D'],
                authoring: { answerSource: 'minterms' },
                answer: { expression: '', minterms: [0, 2, 8, 10, 12, 14], dontCares: [4] },
                grading: { maxScore: 10 },
                learner: {},
                accessibility: { label: '' },
            },
            {
                cells: [
                    ['1', '0', '0', '1'],
                    ['X', '0', '0', '0'],
                    ['1', '0', '0', '1'],
                    ['1', '0', '0', '1'],
                ],
                groups: [
                    { id: 'g1', cells: [0, 2, 8, 10] },
                    { id: 'g2', cells: [8, 10, 12, 14] },
                ],
            },
            { attemptId: 'offline-kmap-attempt', createdAt: '2026-08-13T04:00:00.000Z' },
        );

        expect(result.score).toBe(result.maxScore);
        expect(result.checks.find(check => check.id === 'kmap-sop-minimal')).toMatchObject({
            passed: true,
            solution: '!B*!D+A*!D',
        });
    });

    it('grades a half-adder circuit through the rebuilt offline bundle', async () => {
        global.$electronicsLogicGrader = undefined;
        const bundlePath = join(
            process.cwd(),
            'public/files/perm/idevices/base/electronics-logic/export/electronics-logic-grader.bundle.js',
        );

        await import(`${pathToFileURL(bundlePath).href}?browser-smoke=circuit`);

        const result = global.$electronicsLogicGrader.gradeActivity(
            {
                id: 'offline-circuit',
                type: 'electronics.logic',
                schemaVersion: 1,
                mode: 'circuit',
                prompt: 'Dựng mạch bán tổng.',
                variables: ['A', 'B'],
                authoring: { answerSource: 'expression' },
                answer: {
                    expression: '',
                    minterms: [],
                    dontCares: [],
                    testbench: halfAdder.testbench,
                },
                grading: { maxScore: 8 },
                learner: {},
                accessibility: { label: '' },
            },
            { netlist: halfAdder.netlist },
            { attemptId: 'offline-circuit-attempt', createdAt: '2026-08-16T04:00:00.000Z' },
        );

        expect(result.score).toBe(8);
        expect(result.checks).toHaveLength(8);
        expect(result.checks.every(check => check.passed)).toBe(true);
    });

    it('grades a three-output circuit through the rebuilt offline bundle', async () => {
        global.$electronicsLogicGrader = undefined;
        const bundlePath = join(
            process.cwd(),
            'public/files/perm/idevices/base/electronics-logic/export/electronics-logic-grader.bundle.js',
        );

        await import(`${pathToFileURL(bundlePath).href}?browser-smoke=circuit-three-output`);

        const netlist = {
            schemaVersion: 1,
            nodes: [
                { id: 'in-a', kind: 'INPUT', x: 0, y: 0 },
                { id: 'in-b', kind: 'INPUT', x: 0, y: 100 },
                { id: 'gate-x', kind: 'XOR', x: 100, y: 0 },
                { id: 'gate-and', kind: 'AND', x: 100, y: 60 },
                { id: 'gate-or', kind: 'OR', x: 100, y: 120 },
                { id: 'x-out', kind: 'OUTPUT', x: 200, y: 0 },
                { id: 'and-out', kind: 'OUTPUT', x: 200, y: 60 },
                { id: 'or-out', kind: 'OUTPUT', x: 200, y: 120 },
            ],
            wires: [
                { id: 'w1', from: { node: 'in-a', pin: 'out' }, to: { node: 'gate-x', pin: 'a' } },
                { id: 'w2', from: { node: 'in-b', pin: 'out' }, to: { node: 'gate-x', pin: 'b' } },
                { id: 'w3', from: { node: 'gate-x', pin: 'out' }, to: { node: 'x-out', pin: 'a' } },
                { id: 'w4', from: { node: 'in-a', pin: 'out' }, to: { node: 'gate-and', pin: 'a' } },
                { id: 'w5', from: { node: 'in-b', pin: 'out' }, to: { node: 'gate-and', pin: 'b' } },
                { id: 'w6', from: { node: 'gate-and', pin: 'out' }, to: { node: 'and-out', pin: 'a' } },
                { id: 'w7', from: { node: 'in-a', pin: 'out' }, to: { node: 'gate-or', pin: 'a' } },
                { id: 'w8', from: { node: 'in-b', pin: 'out' }, to: { node: 'gate-or', pin: 'b' } },
                { id: 'w9', from: { node: 'gate-or', pin: 'out' }, to: { node: 'or-out', pin: 'a' } },
            ],
        };
        const testbench = {
            variables: ['A', 'B'],
            inputs: { A: 'in-a', B: 'in-b' },
            outputs: { X: 'x-out', Y: 'and-out', Z: 'or-out' },
            expected: { X: 'A XOR B', Y: 'A AND B', Z: 'A OR B' },
        };

        const result = global.$electronicsLogicGrader.gradeActivity(
            {
                id: 'offline-circuit-three-output',
                type: 'electronics.logic',
                schemaVersion: 1,
                mode: 'circuit',
                prompt: 'Dựng mạch ba đầu ra.',
                variables: ['A', 'B'],
                authoring: { answerSource: 'expression' },
                answer: { expression: '', minterms: [], dontCares: [], testbench },
                grading: { maxScore: 12 },
                learner: {},
                accessibility: { label: '' },
            },
            { netlist },
            { attemptId: 'offline-circuit-three-output-attempt', createdAt: '2026-08-20T04:00:00.000Z' },
        );

        expect(result.score).toBe(12);
        expect(result.checks).toHaveLength(12);
        expect(result.checks.map(check => check.id)).toEqual([
            'case-00-x',
            'case-00-y',
            'case-00-z',
            'case-01-x',
            'case-01-y',
            'case-01-z',
            'case-10-x',
            'case-10-y',
            'case-10-z',
            'case-11-x',
            'case-11-y',
            'case-11-z',
        ]);
        expect(result.checks.every(check => check.passed)).toBe(true);
    });
});
