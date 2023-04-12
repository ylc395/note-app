export interface LintProblem {
  from: number;
  to: number;
  message: string;
  fixable: boolean;
}

export interface LintFix {
  from: number;
  to: number;
  replacement: string;
}
