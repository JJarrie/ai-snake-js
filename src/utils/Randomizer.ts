class Randomizer {
    public static floatBetween(a: number, b: number): number {
        const min = Math.min(a, b)
        const max = Math.max(a, b)

        return Math.random() * (max - min) + min
    }

    public static intBetween(a: number, b: number): number {
        return Math.floor(Randomizer.floatBetween(a, b))
    }
}

export default Randomizer