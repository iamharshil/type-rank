const COMMON_WORDS: string[] = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'great', 'between', 'need', 'large', 'often', 'important', 'long', 'thing', 'right', 'still',
    'each', 'much', 'before', 'high', 'number', 'place', 'find', 'here', 'old', 'many',
    'tell', 'sentence', 'help', 'through', 'line', 'turn', 'move', 'live', 'found', 'world',
    'next', 'below', 'country', 'plant', 'last', 'school', 'never', 'start', 'city', 'story',
    'away', 'animal', 'house', 'point', 'mother', 'answer', 'letter', 'learn', 'should', 'America',
    'every', 'near', 'keep', 'food', 'thought', 'head', 'hand', 'above', 'often', 'enough',
    'change', 'follow', 'play', 'small', 'end', 'between', 'open', 'seem', 'together', 'might',
    'while', 'close', 'night', 'real', 'life', 'few', 'north', 'book', 'carry', 'began',
    'river', 'group', 'always', 'both', 'paper', 'music', 'those', 'under', 'second', 'later',
    'run', 'idea', 'enough', 'face', 'watch', 'far', 'walk', 'white', 'children', 'begin',
    'hard', 'example', 'being', 'quite', 'without', 'whole', 'along', 'might', 'against', 'pattern',
    'problem', 'become', 'build', 'system', 'program', 'design', 'develop', 'process', 'create', 'project',
    'function', 'method', 'class', 'object', 'value', 'result', 'return', 'string', 'array', 'number',
    'error', 'test', 'data', 'input', 'output', 'event', 'state', 'action', 'update', 'render',
    'component', 'module', 'package', 'import', 'export', 'default', 'const', 'variable', 'type', 'interface'
];

const CODE_WORDS: string[] = [
    'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'class', 'extends', 'implements', 'interface',
    'import', 'export', 'default', 'async', 'await', 'promise', 'try', 'catch', 'finally',
    'throw', 'new', 'this', 'super', 'static', 'public', 'private', 'protected', 'abstract',
    'typeof', 'instanceof', 'void', 'null', 'undefined', 'true', 'false', 'string', 'number',
    'boolean', 'object', 'array', 'map', 'set', 'symbol', 'enum', 'type', 'namespace',
    'module', 'require', 'package', 'version', 'config', 'options', 'params', 'args', 'callback',
    'handler', 'listener', 'middleware', 'controller', 'service', 'model', 'schema', 'query',
    'request', 'response', 'status', 'error', 'message', 'data', 'body', 'header', 'token',
    'render', 'component', 'state', 'props', 'context', 'effect', 'hook', 'ref', 'memo',
    'dispatch', 'action', 'reducer', 'store', 'selector', 'slice', 'middleware', 'thunk',
    'route', 'path', 'method', 'endpoint', 'api', 'fetch', 'axios', 'http', 'url', 'port',
    'database', 'table', 'column', 'index', 'primary', 'foreign', 'constraint', 'migration',
    'deploy', 'build', 'compile', 'bundle', 'minify', 'optimize', 'debug', 'profile', 'test',
    'assert', 'expect', 'describe', 'it', 'mock', 'stub', 'spy', 'fixture', 'snapshot', 'coverage'
];

const QUOTES: string[] = [
    "The only way to do great work is to love what you do",
    "Innovation distinguishes between a leader and a follower",
    "Stay hungry stay foolish",
    "Code is like humor when you have to explain it it is bad",
    "First solve the problem then write the code",
    "The best error message is the one that never shows up",
    "Programming is not about typing it is about thinking",
    "Simplicity is the soul of efficiency",
    "Make it work make it right make it fast",
    "Talk is cheap show me the code",
    "Any fool can write code that a computer can understand",
    "Good programmers write code that humans can understand",
    "Experience is the name everyone gives to their mistakes",
    "The most disastrous thing that you can ever learn is your first programming language",
    "Software is a great combination between artistry and engineering",
    "The best way to predict the future is to invent it",
    "Measuring programming progress by lines of code is like measuring aircraft building progress by weight",
    "Perfection is achieved not when there is nothing more to add but when there is nothing left to take away",
    "The function of good software is to make the complex appear to be simple",
    "Before software can be reusable it first has to be usable"
];

export type WordMode = 'common' | 'code' | 'quotes';

export function generateWords(count: number, mode: WordMode = 'common'): string[] {
    if (mode === 'quotes') {
        return generateQuoteWords(count);
    }

    const source = mode === 'code' ? CODE_WORDS : COMMON_WORDS;
    const words: string[] = [];
    let lastWord = '';

    for (let i = 0; i < count; i++) {
        let word: string;
        do {
            word = source[Math.floor(Math.random() * source.length)];
        } while (word === lastWord);
        words.push(word);
        lastWord = word;
    }

    return words;
}

function generateQuoteWords(targetCount: number): string[] {
    const words: string[] = [];
    const usedIndices = new Set<number>();

    while (words.length < targetCount) {
        let idx: number;
        do {
            idx = Math.floor(Math.random() * QUOTES.length);
        } while (usedIndices.has(idx) && usedIndices.size < QUOTES.length);
        usedIndices.add(idx);

        const quoteWords = QUOTES[idx].split(' ');
        words.push(...quoteWords);

        if (usedIndices.size >= QUOTES.length) {
            usedIndices.clear();
        }
    }

    return words.slice(0, targetCount);
}

export function getWordCountForDuration(durationSeconds: number): number {
    // Estimate ~40 WPM average, ~5 chars per word → need enough words
    const estimatedWpm = 60;
    const minutes = durationSeconds / 60;
    return Math.ceil(estimatedWpm * minutes * 1.5); // 1.5x buffer
}
