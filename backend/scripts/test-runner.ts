/**
 * Test Runner - Ejecuta tests TypeScript compilados sin Jest
 * Proporciona funcionalidad similar a describe/it para testing
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface SuiteResult {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

class SimpleTestRunner {
  private suites: Map<string, { tests: Array<{ name: string; fn: Function }>, beforeAll?: Function, beforeEach?: Function }> = new Map();
  private currentSuite: string = '';
  private results: SuiteResult[] = [];

  describe(name: string, callback: () => void): void {
    this.currentSuite = name;
    this.suites.set(name, { tests: [], beforeAll: undefined, beforeEach: undefined });
    callback();
  }

  beforeAll(callback: () => Promise<void> | void): void {
    if (this.currentSuite && this.suites.has(this.currentSuite)) {
      this.suites.get(this.currentSuite)!.beforeAll = callback;
    }
  }

  beforeEach(callback: () => void): void {
    if (this.currentSuite && this.suites.has(this.currentSuite)) {
      this.suites.get(this.currentSuite)!.beforeEach = callback;
    }
  }

  it(name: string, callback: Function): void {
    if (this.currentSuite && this.suites.has(this.currentSuite)) {
      this.suites.get(this.currentSuite)!.tests.push({ name, fn: callback });
    }
  }

  expect(actual: any): any {
    return {
      toBeDefined: () => {
        if (actual === undefined) throw new Error(`Expected to be defined but was undefined`);
      },
      toBe: (expected: any) => {
        if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
      },
      toBeGreaterThan: (expected: number) => {
        if (!(actual > expected)) throw new Error(`Expected ${actual} > ${expected}`);
      },
      toBeLessThan: (expected: number) => {
        if (!(actual < expected)) throw new Error(`Expected ${actual} < ${expected}`);
      },
      toBeGreaterThanOrEqual: (expected: number) => {
        if (!(actual >= expected)) throw new Error(`Expected ${actual} >= ${expected}`);
      },
      toBeLessThanOrEqual: (expected: number) => {
        if (!(actual <= expected)) throw new Error(`Expected ${actual} <= ${expected}`);
      },
      toBeTrue: () => {
        if (actual !== true) throw new Error(`Expected true but got ${actual}`);
      },
      toBeFalsy: () => {
        if (actual) throw new Error(`Expected falsy but got ${actual}`);
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toHaveLength: (expected: number) => {
        if (actual.length !== expected) throw new Error(`Expected length ${expected} but got ${actual.length}`);
      },
      toMatch: (pattern: RegExp) => {
        if (!pattern.test(actual)) throw new Error(`Expected ${actual} to match ${pattern}`);
      },
      toThrow: () => {
        try {
          actual();
          throw new Error(`Expected to throw but did not`);
        } catch (e) {
          // Expected
        }
      },
    };
  }

  async run(): Promise<void> {
    console.log('\n🧪 Ejecutando Suite de Tests\n');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    const suiteStart = Date.now();

    for (const [suiteName, suite] of this.suites) {
      console.log(`\n📋 ${suiteName}`);
      const suiteTests: TestResult[] = [];
      let suitePassed = 0;
      let suiteFailed = 0;

      // Ejecutar beforeAll
      if (suite.beforeAll) {
        try {
          await Promise.resolve(suite.beforeAll());
        } catch (error) {
          console.error(`  ❌ beforeAll falló: ${(error as Error).message}`);
        }
      }

      for (const test of suite.tests) {
        const testStart = Date.now();
        try {
          // Ejecutar beforeEach
          if (suite.beforeEach) {
            suite.beforeEach();
          }

          await Promise.resolve(test.fn());
          const duration = Date.now() - testStart;
          console.log(`  ✓ ${test.name} (${duration}ms)`);
          suiteTests.push({ name: test.name, passed: true, duration });
          suitePassed++;
          totalPassed++;
        } catch (error) {
          const duration = Date.now() - testStart;
          console.log(`  ✗ ${test.name}`);
          console.log(`    └─ ${(error as Error).message}`);
          suiteTests.push({
            name: test.name,
            passed: false,
            error: (error as Error).message,
            duration,
          });
          suiteFailed++;
          totalFailed++;
        }
        totalTests++;
      }

      this.results.push({
        name: suiteName,
        tests: suiteTests,
        totalTests: suite.tests.length,
        passedTests: suitePassed,
        failedTests: suiteFailed,
        duration: Date.now() - suiteStart,
      });
    }

    // Resumen final
    const duration = Date.now() - suiteStart;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Resultados: ${totalPassed}/${totalTests} tests pasados`);
    if (totalFailed > 0) {
      console.log(`❌ ${totalFailed} tests fallidos`);
    } else {
      console.log(`✅ Todos los tests pasaron`);
    }
    console.log(`⏱️  Duración total: ${duration}ms`);
    console.log(`${'='.repeat(60)}\n`);

    process.exit(totalFailed > 0 ? 1 : 0);
  }
}

// Exportar instancia global
export const testRunner = new SimpleTestRunner();
export const describe = testRunner.describe.bind(testRunner);
export const it = testRunner.it.bind(testRunner);
export const beforeAll = testRunner.beforeAll.bind(testRunner);
export const expect = testRunner.expect.bind(testRunner);
