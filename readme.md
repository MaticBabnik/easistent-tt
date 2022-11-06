# easistent-tt

eAsistent public timetable scraper/graphql API. Vegova instance: [GraphiQL](https://vegova.sync.si/graphiql) | (`https://vegova.sync.si/graphql`)

## Usage
The basic scraper is contained in `parser.ts`.
```ts
//razred,ucilnica,sola, teden?
// razred _ali_ ucilnica je lahko 0, teden ni nujen                  
getTimetable(460305, 0, 182)
```
The `School` class automatically scrapes and caches the data.
```ts
const vegova = new School(182, '30a1b45414856e5598f2d137a5965d5a4ad36826');
vegova.setup();

//cez nekaj sekund
vegova.getTeachers() // ["A. Žugelj","M. Seme","M. Markoja", ...]
vegova.getClassrooms() // ["2","3","4","7","8", ...]
vegova.getClasses() //[ "E1A","E1B","E1C","G1A","G1B","R1A", ...]

vegova.classTimetables.get("R3A").days[0].lessons[0][0].name // "OMTp"
vegova.teacherTimetables.get("A. Volčini") //vfinder ;)
vegova.classroomTimetables.get("106").days[0].lessons[0][0].className // "R3C"
```

All of the above is also exposed as a GraphQL API...
```
look at the schema in "src/graphql"
```

### TODO
- expose the week option (will complicate cacheing and teacher timetables (minimum 36 requests / week))
- cleanup the code
- pay employees
