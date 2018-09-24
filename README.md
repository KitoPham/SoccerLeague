## Soccer League Ranking Tables
#### Getting Started
This node.js command line interface application reads in an input file
containing a series of matches and outputs a ranking table showing the
standings of each team. The input file can be constructed in the format shown
here.

> Ninja Turtles 3, Foot Clan 0 <br/>
> Humans 2, Foot Clan 3 <br/>
> Yaotyl's Generals 8, Ninja Turtles 1 <br/>
> Ninja Turtles 2, Humans 0 <br />
> [TeamName] [Score], [TeamName] [Score] <br/>

Each team is assigned points based off the results of the matches found in
the input file. A win will provide a team with 3 points, a tie 1 point, and a
loss is 0 points. The output will be formatted as followed ranked by
whichever teams have higher points and in the event of tied rankings they are
sorted alphabetically by team name.

> 1\. Ninja Turtles, 6 pts <br />
> 2\. Foot Clan, 3 pts <br />
> 2\. Yaotyl's Generals, 3 pts <br />
> 3\. Humans, 0 pts <br />

To be able to run this application the following programs will need to be
installed on your machine.
* Git Bash https://git-scm.com/downloads
* Node.Js https://nodejs.org/en/download/

*Disclaimer if you've already downloaded the SoccerLeague folder onto your computer you can skip the first command and make sure that your terminal is pointed to this folder via the cd command*

Once you have installed these two programs, launch your Terminal application
and type the follow commands in separately.
```git
    git clone https://github.com/kitopham/SoccerLeague
```
```git
    cd SoccerLeague
```

The first line will install a local copy of the application's code onto your machine and then next will point your terminal to the application's folder.

Next enter in the command below to get started
```git
    node SoccerLeagueProgram.js score sample-input.txt
```
You should get an output that looks like this.
>1\. Tarantulas, 6 pts <br />
>2\. Lion's, 5 pts <br />
>3\. FC Awesome, 1 pt <br />
>3\. Snakes, 1 pt <br />
>5\. Grouches, 0 pts <br />

If you've received this output then congrats!! You're all set to start
using the Soccer League command line tool! To be able to run your own input
just type in the previous command but replace `sample-input.txt` with
your own file name. Just remember to make sure that each line of your input is
constructed properly like as followed.
>Flying Purple Iguanas 3, Not So Flying Elephants 4
*Disclaimer: The application assumes that no team name will have a comma*

#### Customize
The code for this application is modularized such that it can be modified for
personal use easily. The following snippet is from the `SoccerLeagueProgram.js`
file. The application checks the keywords after `node SoccerLeagueProgram`
and runs whatever code is within the specified case body.

```Javascript
switch(process.argv[2]){
  case 'score':
    soccerLeagueModule.calcLeagueScores(process.argv[3], (rankingMap) => {
      console.log(rankingMap.toString());
    });
    break;

  case 'test':
    soccerLeagueModule.testEverything();
    break;

  default:
    console.log('Invalid Command Please Run With \n' +
    'node SoccerLeagueProgram.js score [filename]')
    break;
}
```
What should be noted is that the ranking table is outputted through ` console.log(rankingMap.toString());`. This line can be replaced or modified,
should you wish to do something beyond just printing the table.
`calcLeagueScores` operates by running through its function code to set up the
ranking table and then outputs it as rankingMap to the a callback / function
that was given in it's parameter. In this case, the callback being passed in is

```Javascript
(rankingMap) => {
  console.log(rankingMap.toString());
}
```
`rankingMap` is of a custom class that extends the Map class found in
`SoccerLeagueModule.js`. `rankingMap`'s entries are sorted based first on value
desc and then by key alphabetically asc and its `toString()` method constructs
the format shown in the output examples above. In all other cases, this object
operates exactly as any other Map object.

#### Testing
It should be noted that SoccerLeagueProgram also supports a test argument. This
argument will run a series of tests found in the `testEverything()` function
in `SoccerLeagueModule.js`. To add your own custom test cases, call the test
functions within that function with the values you want to test with and then
run the command below in your terminal.
```git
  node SoccerLeagueProgram.js test
```

Your output will be a series of tests that look something like this. A failed
test will show you a found result and your expected result as well as other
information pertaining to your specific test.
```bash
Sort: alreadySorted
Passed

Sort: allTied
Passed

Sort: unSortedTied
Passed
```

*Disclaimer : For the scope of this the following test are checking based off toString() for array inputs. In a more advanced project deep comparison through checking each index of the array would be a better way to test.*

The tests currently supported are:

`testCalc(test, input, expectedOutput);`
```Javascript
/* Example */
  testCalc('Calc: example','sample-input.txt', 'expected-output.txt');
```
Given an input file and an output file that holds the expected result
tests to make sure that the application gives back a result from the input
that matches the expected output. See `sample-input.txt` and `expected-output.txt`
for an example of what the files should look like.


`testPrepare(test, line, name);`
```Javascript
/* Example */
  testPrepare('Prepare: real-team',
  '1. FFC Turbine Potsdam 4', '1. FFC Turbine Potsdam');

```
Given a line such as '1. FFC Turbine Potsdam 4', test to check if the method
`prepareClubName()` can accurately parse out the score number and return the
correct name

`testModifiers(test, scoreNum1, scoreNum2, expectedModifiers);`
```Javascript
/* Example */
  testModifiers('Modifier: Team 2 Win', 0, 1, [0,3]);

```
Given 2 score numbers, tests that the method `getModifiers()` can correctly
return a tuple that matches the expected modifier's tuple [0,3] representing
how many ranking points each team should be modified by.

`testUpdate(test, clubName, modifier, entries, expectedScore);`
```Javascript
/* Example */
  testUpdate('Update: AddModifierMiddle', 'b', 3,
    [['a', 2],['b', 1],['c', 4]],
    [['a', 2],['b', 4],['c', 4]]
  );
```
Tests to make sure after applying the modifier to a map made from entries
like [[Team1, 0], [Team2, 1]] that the specified clubName has the correct
score and that only the specified club's ranking points were affected by
checking with the expectedScore(same format as entries).

`testSortedMap(test, entries, expected)`
```Javascript
/* Example */
  testSortedMap('Sort: alphabeticalMixCapsNums',
    [['1', 0],['c', 0], ['A', 0]],
    [['1', 0],['A', 0], ['c', 0]]
  );
```
Given a map of entries [[Team1, 0],[Team2,3]], tests that the resulting map
matches a sorted by values then keys map given through the expected parameter
which takes the form of [[Team2,3],[Team1,0]]

`testSortedMapToString(test, entries, expected)`
``` Javascript
/* Example */
  testSortedMapToString('Sort: tiedLead',
    [['b', 3],['c', 0], ['a', 3]],
    '1. a, 3 pts\n1. b, 3 pts\n3. c, 0 pts\n'
  );
```
Given a map of entries [[Team1, 0],[Team2,3]], tests that the toString method
of the map follows the format of the ranking table shown above with \n being
used for linebreaks by checking with the expected parameter which should be in
the format of
"1. Team2 , 3 pts\n2. Team1, 0 pts"
