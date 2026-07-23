// Syntaxia course roadmap definitions. Weave lessons, challenges, games, projects, boss battles, exams.
import { LANGS } from './languages.js';

// Base lessons that we'll wrap inside roadmap nodes
const BASE_LESSONS = {
  python: [
    {id:'py1',t:'Hello, World!',lv:'Beginner',xp:20,
     exp:'Every coder starts with printing "Hello, World!". In Python, the print() function outputs text to the console. Python was designed to be readable, so your first program is just one line.',
     task:'Print the text "Hello, World!" to the console.',
     starter:'# Write your first Python program below\n# Use print() to display Hello, World!\n',
     code:'print("Hello, World!")',
     out:'Hello, World!',
     quiz:{q:'What Python function displays text on the screen?',opts:['write()','show()','print()','display()'],ans:2}},

    {id:'py2',t:'Variables',lv:'Beginner',xp:25,
     exp:'Variables store data so you can reuse it. In Python you just write name = value. Python figures out the type automatically. Variable names should use snake_case.',
     task:'Create a variable called name set to "Alex", and age set to 20. Print both on separate lines.',
     starter:'# Create two variables: name and age\n# Then print each one\n',
     code:'name = "Alex"\nage = 20\nprint(name)\nprint(age)',
     out:'Alex\n20',
     quiz:{q:'Which style is correct for Python variable names?',opts:['myName','MyName','my_name','my-name'],ans:2}},

    {id:'py3',t:'If / Else',lv:'Beginner',xp:30,
     exp:'if/else lets your code make decisions. The condition goes after if, and the block is indented 4 spaces. elif checks additional conditions. else catches everything that did not match.',
     task:'Given score = 85, print "B" because score is >= 70 but < 90.',
     starter:'score = 85\n# Write if/elif/else to print "A" if >=90, "B" if >=70, "C" if >=50, else "F"\n',
     code:'score = 85\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelif score >= 50:\n    print("C")\nelse:\n    print("F")',
     out:'B',
     quiz:{q:'What keyword checks an additional condition in Python?',opts:['else if','otherwise','elif','elseif'],ans:2}},

    {id:'py4',t:'Loops',lv:'Beginner',xp:35,
     exp:'for loops iterate over a sequence. range(start, stop, step) generates numbers. The loop variable takes each value in turn. while loops run until a condition is False.',
     task:'Use a for loop with range() to print numbers 2, 4, 6, 8, 10.',
     starter:'# Print even numbers 2, 4, 6, 8, 10 using a for loop\n',
     code:'for i in range(2, 11, 2):\n    print(i)',
     out:'2\n4\n6\n8\n10',
     quiz:{q:'What does range(0, 10, 2) produce?',opts:['0 to 10','0,2,4,6,8','2,4,6,8,10','1,3,5,7,9'],ans:1}}
  ],
  javascript: [
    {id:'js1',t:'Hello, World!',lv:'Beginner',xp:20,
     exp:'JavaScript is the language of the web. console.log() prints output. Every interactive element on a website uses JavaScript.',
     task:'Use console.log() to print "Hello, World!" to the console.',
     starter:'// Print Hello, World! using console.log\n',
     code:'console.log("Hello, World!");',
     out:'Hello, World!',
     quiz:{q:'What function prints output in JavaScript?',opts:['print()','echo()','console.log()','output()'],ans:2}},

    {id:'js2',t:'Variables',lv:'Beginner',xp:25,
     exp:'Use const for values that never change and let for values that do. Avoid var — it has confusing scope rules. JavaScript is loosely typed: you do not declare the type.',
     task:'Declare a const name = "Alex", and let age = 20. Print both to console.',
     starter:'// Declare const name and let age\n// Log each value\n',
     code:'const name = "Alex";\nlet age = 20;\nconsole.log(name);\nconsole.log(age);',
     out:'Alex\n20',
     quiz:{q:'Which keyword declares a block-scoped variable that can be reassigned?',opts:['const','let','var','def'],ans:1}},

    {id:'js3',t:'Arrow Functions',lv:'Intermediate',xp:30,
     exp:'Arrow functions are a concise syntax for writing functions. e.g., const add = (a, b) => a + b; They are commonly used for callbacks and arrays.',
     task:'Define an arrow function square(n) that returns n * n. Call it with 5 and print the result.',
     starter:'// Write arrow function square(n) and console.log square(5)\n',
     code:'const square = (n) => n * n;\nconsole.log(square(5));',
     out:'25',
     quiz:{q:'How do arrow functions declare parameters?',opts:['fn(x)','x => x','function(x)','def(x)'],ans:1}}
  ],
  html: [
    {id:'html1',t:'HTML Structure',lv:'Beginner',xp:20,
     exp:'HTML defines the structure of web pages using tags. An element consists of an opening tag, content, and a closing tag. The boilerplate starts with <html>, <head>, and <body>.',
     task:'Create an h1 tag with text "Hello, Web!" inside the body.',
     starter:'<!DOCTYPE html>\n<html>\n<body>\n  <!-- Add h1 here -->\n</body>\n</html>',
     code:'<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, Web!</h1>\n</body>\n</html>',
     out:'<h1>Hello, Web!</h1>',
     quiz:{q:'Which HTML tag represents the main heading?',opts:['<head>','<h6>','<h1>','<p>'],ans:2}}
  ],
  css: [
    {id:'css1',t:'CSS Styling',lv:'Beginner',xp:20,
     exp:'CSS styles HTML elements. Select elements by tag name, class (.classname), or ID (#idname). Apply properties like color, background-color, border, and margin.',
     task:'Add a style block to color h1 elements red.',
     starter:'<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Style h1 red */\n  </style>\n</head>\n<body>\n  <h1>Alert!</h1>\n</body>\n</html>',
     code:'<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    h1 { color: red; }\n  </style>\n</head>\n<body>\n  <h1>Alert!</h1>\n</body>\n</html>',
     out:'h1 { color: red; }',
     quiz:{q:'Which CSS selector styles elements with a specific class?',opts:['#classname','.classname','*classname','@classname'],ans:1}}
  ],
  sql: [
    {id:'sql1',t:'SELECT Basics',lv:'Beginner',xp:20,
     exp:'SQL (Structured Query Language) manages databases. SELECT retrieves columns, FROM targets a table. Use "*" to get all columns. Statements end with a semicolon.',
     task:'Retrieve the name and email columns from the users table.',
     starter:'-- SELECT name and email FROM users\n',
     code:'SELECT name, email FROM users;',
     out:'name  | email\nAlice | alice@test.com\nBob   | bob@test.com',
     quiz:{q:'Which SQL command retrieves data?',opts:['GET','SELECT','FETCH','READ'],ans:1}},

    {id:'sql2',t:'WHERE Clause',lv:'Beginner',xp:25,
     exp:'WHERE filters rows based on a condition. Use operators like =, >, <, AND, OR, and BETWEEN. Use LIKE for pattern matching (e.g. name LIKE "A%").',
     task:'Filter users who are between 18 and 30, and name starts with "A".',
     starter:'-- SELECT all from users WHERE age between 18 and 30 AND name like "A%"\n',
     code:'SELECT * FROM users\nWHERE age BETWEEN 18 AND 30\n  AND name LIKE "A%"\nORDER BY age ASC;',
     out:'id | name  | age\n3  | Alice | 22\n7  | Ahmed | 27',
     quiz:{q:'What operator matches a pattern in SQL?',opts:['MATCH','REGEX','LIKE','CONTAINS'],ans:2}}
  ]
};

// Generates an entire roadmap path for a language, weaving lessons, challenges, mini-games, boss battles, projects, exams, and certificates.
export function generateRoadmap(langId, langName) {
  const base = BASE_LESSONS[langId] || [
    {id: langId + '_l1', t:'Intro to ' + langName, lv:'Beginner', xp:20,
     exp:'Welcome to ' + langName + '! Every programming journey starts with the basics. Let\'s write a simple statement.',
     task:'Print "Hello, ' + langName + '!" to the console.',
     starter:'// Write your code below\n',
     code:'console.log("Hello, ' + langName + '!");',
     out:'Hello, ' + langName + '!',
     quiz:{q:'What is ' + langName + '?',opts:['A language','A framework','A tool','An IDE'],ans:0}},
    {id: langId + '_l2', t:'Syntax & Variables', lv:'Beginner', xp:25,
     exp:'Variables are containers for values. Define a variable x with a value of 10.',
     task:'Declare a variable named x set to 10 and print it.',
     starter:'// Declare x = 10 and print it\n',
     code:'let x = 10;\nconsole.log(x);',
     out:'10',
     quiz:{q:'What is a variable?',opts:['A constant','A loop','A named container','A file'],ans:2}}
  ];

  const roadmap = [];
  
  // Chapter 1: The Gateway (Basics)
  roadmap.push({
    id: langId + '_ch1_start',
    type: 'header',
    title: 'Chapter 1: The Gateway',
    desc: 'Unlocking the core syntax of ' + langName
  });

  // 1st Lesson (Hello World)
  roadmap.push({
    ...base[0],
    type: 'lesson',
    chapter: 1,
    stars: 3
  });

  // Challenge node
  roadmap.push({
    id: langId + '_ch_1',
    type: 'challenge',
    title: 'Syntax Duel',
    lv: 'Beginner',
    xp: 30,
    exp: 'A syntax speed drill. Match the keywords and resolve compiler checks.',
    task: 'Write a statement that defines status = "online" and print it.',
    starter: '// Define status and print it\n',
    code: langId === 'python' ? 'status = "online"\nprint(status)' : 'let status = "online";\nconsole.log(status);',
    out: 'online',
    quiz: {q:'Which is correct syntax?',opts:['status="online"','var status == "online"','let status = "online"','status : online'],ans:2}
  });

  // Mini-Game: Debug Race
  roadmap.push({
    id: langId + '_game_debug',
    type: 'game',
    gameType: 'debug',
    title: 'Bug Race',
    desc: 'Race against time to squash syntax bugs!',
    xp: 35,
    coins: 50,
    timeLimit: 40,
    bugs: [
      { broken: 'prnt("Hello")', fixed: 'print("Hello")', err: 'Typo in print' },
      { broken: 'let x == 10', fixed: 'let x = 10', err: 'Incorrect assignment operator' },
      { broken: 'if (x = 5)', fixed: 'if (x == 5)', err: 'Assignment inside condition' }
    ]
  });

  // Chapter Project
  roadmap.push({
    id: langId + '_proj_intro',
    type: 'project',
    title: 'Project: Smart Calculator',
    desc: 'Build a calculator that handles addition and subtraction.',
    xp: 60,
    coins: 80,
    steps: [
      'Define function add(a, b)',
      'Define function subtract(a, b)',
      'Add inputs and verify outputs'
    ],
    starterCode: langId === 'python' 
      ? 'def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n\nprint(add(10, 5))\nprint(subtract(10, 5))'
      : 'const add = (a, b) => a + b;\nconst subtract = (a, b) => a - b;\nconsole.log(add(10, 5));\nconsole.log(subtract(10, 5));',
    out: '15\n5'
  });

  // Boss Battle
  roadmap.push({
    id: langId + '_boss_1',
    type: 'boss',
    title: 'Boss Battle: Compiler Guardian',
    desc: 'Defeat the Guardian by solving a multi-stage logic task in under 90 seconds!',
    xp: 100,
    gems: 3,
    timeLimit: 90,
    stages: [
      {
        task: 'Stage 1: Return double of a number. Complete doubleNumber(n).',
        starter: langId==='python'?'def doubleNumber(n):\n    # Return n * 2\n':'const doubleNumber = (n) => {\n    // Return n * 2\n};',
        code: langId==='python'?'def doubleNumber(n):\n    return n * 2\nprint(doubleNumber(12))':'const doubleNumber = (n) => n * 2;\nconsole.log(doubleNumber(12));',
        out: '24'
      },
      {
        task: 'Stage 2: Filter negatives. Complete filterNegatives(arr).',
        starter: langId==='python'?'def filterNegatives(arr):\n    # Return list of numbers >= 0\n':'const filterNegatives = (arr) => {\n    // Return array of numbers >= 0\n};',
        code: langId==='python'?'def filterNegatives(arr):\n    return [x for x in arr if x >= 0]\nprint(filterNegatives([1, -2, 3, -4, 0]))':'const filterNegatives = (arr) => arr.filter(x => x >= 0);\nconsole.log(filterNegatives([1, -2, 3, -4, 0]).join(","));',
        out: langId==='python'?'[1, 3, 0]':'1,3,0'
      }
    ]
  });

  // Chapter 2: The Ascent (Logic)
  roadmap.push({
    id: langId + '_ch2_start',
    type: 'header',
    title: 'Chapter 2: The Ascent',
    desc: 'Harness loops, structures, and dynamic controls'
  });

  // 2nd Lesson
  roadmap.push({
    ...(base[1] || base[0]),
    type: 'lesson',
    chapter: 2,
    stars: 3
  });

  // Mini-Game: Code Puzzle
  roadmap.push({
    id: langId + '_game_puzzle',
    type: 'game',
    gameType: 'puzzle',
    title: 'Code Puzzle: Logic Reorder',
    desc: 'Rearrange code snippets to reconstruct a valid program!',
    xp: 40,
    coins: 60,
    lines: langId === 'python'
      ? ['def greet(name):', '    if name:', '        print("Hi " + name)', 'greet("Alice")']
      : ['const greet = (name) => {', '  if (name) {', '    console.log("Hi " + name);', '  }', '};', 'greet("Alice");'],
    out: 'Hi Alice'
  });

  // 3rd Lesson (if available)
  if (base[2]) {
    roadmap.push({
      ...base[2],
      type: 'lesson',
      chapter: 2,
      stars: 3
    });
  }

  // Mini-Game: Typing Speed
  roadmap.push({
    id: langId + '_game_typing',
    type: 'game',
    gameType: 'typing',
    title: 'Syntax Shooter',
    desc: 'Type keywords as they fall to score points and blast bugs!',
    xp: 35,
    coins: 50,
    words: ['function', 'return', 'import', 'class', 'const', 'while', 'execute', 'resolve']
  });

  // Boss Battle 2
  roadmap.push({
    id: langId + '_boss_2',
    type: 'boss',
    title: 'Boss Battle: The Recursion Beast',
    desc: 'A timed race to implement a fibonacci or factorial checker.',
    xp: 150,
    gems: 5,
    timeLimit: 120,
    stages: [
      {
        task: 'Return the factorial of n. Complete factorial(n).',
        starter: langId==='python'?'def factorial(n):\n    # Return factorial of n\n':'const factorial = (n) => {\n    // Return factorial of n\n};',
        code: langId==='python'?'def factorial(n):\n    return 1 if n<=1 else n * factorial(n-1)\nprint(factorial(5))':'const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);\nconsole.log(factorial(5));',
        out: '120'
      }
    ]
  });

  // Chapter 3: The Peak (Exam & Certification)
  roadmap.push({
    id: langId + '_ch3_start',
    type: 'header',
    title: 'Chapter 3: The Peak',
    desc: 'Showcase your mastery and earn credentials'
  });

  // Final Exam
  roadmap.push({
    id: langId + '_final_exam',
    type: 'exam',
    title: 'Final Mastery Exam',
    desc: 'A rigorous evaluation of syntax, debugging, and programming theory.',
    xp: 200,
    coins: 100,
    questions: [
      { q: 'Which data structure is FIFO (First-In, First-Out)?', opts: ['Stack', 'Queue', 'Array', 'Tree'], ans: 1 },
      { q: 'What is the time complexity of binary search?', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], ans: 2 },
      { q: 'What does API stand for?', opts: ['Application Program Interface', 'Application Programming Interface', 'Access Program Internet', 'Automated Protocol Interface'], ans: 1 }
    ]
  });

  // Certificate Node
  roadmap.push({
    id: langId + '_certificate',
    type: 'certificate',
    title: langName + ' Developer Certificate',
    desc: 'Unlocks a verified, downloadable credential with unique QR code.'
  });

  return roadmap;
}

// Assemble paths map
export const LESSONS = {};
LANGS.forEach(l => {
  LESSONS[l.id] = generateRoadmap(l.id, l.n);
});
