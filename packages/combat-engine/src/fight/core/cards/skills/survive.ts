export class SurviveSkill {
  public readonly name: string;
  private consumed = false;

  constructor(name: string) {
    this.name = name;
  }

  tryConsume(): boolean {
    if (this.consumed) return false;
    this.consumed = true;
    return true;
  }
}
