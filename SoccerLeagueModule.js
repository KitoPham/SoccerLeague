'use strict';
const assert = require('assert')
const fs = require('fs'),
stream = require('stream'),
readline = require('readline');


//Parses an input file line by line asynchronously. When parsing is
//finished sorts the values into a ranking map assigning scores based off
//wins and ties. Wins providing 3 pts for rank and ties providing 1 pt to
//corresponding clubs. A ranking list going from highest to lowest
//ranking scores is then returned.
const calcLeagueScores = function(leagueName, callback){
  const filePath = leagueName
  const instream = fs.createReadStream(filePath, {encoding:'utf8'});
  instream.on('error', (error) => {
    return console.error("There has been an error", error);
  });
  let outstream = new stream;
  const lineReader = readline.createInterface(instream, outstream);
  let rankingMap = new Map()

  lineReader.on('line', (line) => {
    const gameArray = line.split(', ');
    const club1Score = prepareClubName(gameArray[0].split(' '));
    const club2Score = prepareClubName(gameArray[1].split(' '));
    const modifiers = getModifiers(club1Score[1], club2Score[1])

    updateRanking(club1Score[0], modifiers[0], rankingMap);
    updateRanking(club2Score[0], modifiers[1], rankingMap);
  });

  lineReader.on('close', () => {
    const sortedMap = new SortedRankMap([...rankingMap.entries()]);
    callback(sortedMap);
  });
};

//Combines the club name into one index and returns a tuple
//holding only the club name as one value, and the game score as the other
const prepareClubName =  function(score){
  let clubName = score[0];
  if(score.length > 2){
    for (var i = 1; i < score.length-1; i++) {
      clubName += ' ' + score[i];
    }
  }
  const scoreNumber = score[score.length-1];

  return [clubName,scoreNumber];
}

//Compares two score numbers and assigns a modifier based on whether
//the numbers are greater than or equal to each other. Returns a tuple
//holding the modifiers with indices corresponding to the numbers given.
const getModifiers = function(scoreNum1, scoreNum2){
  let club1Modifier = 0;
  let club2Modifier = 0;

  if (scoreNum1 > scoreNum2){
    club1Modifier = 3;
  } else if (scoreNum1 < scoreNum2){
    club2Modifier = 3;
  } else {
    club1Modifier = 1;
    club2Modifier = 1;
  }

  return [club1Modifier, club2Modifier]

}

//Uses the club name to find its score in the ranking and adds the
//modifier to its ranking points. If the club name doesn't exist in the rankings,
//a new entry is made. Returns an error if negative modifier is given
const updateRanking = function(clubName, modifier, rankingMap){
  if(modifier < 0) return console.error('negative modifier not allowed')
  if(!clubName.length > 0) return console.error('no name')
  const currentRankingPoints = rankingMap.get(clubName)
  rankingMap.set(clubName,
    (currentRankingPoints != null ? currentRankingPoints : 0) + modifier);
}

//Map class extensions for the rank maps
class SortedRankMap extends Map{
  //Entries are sorted based on values desc and then key asc
  constructor(entries){
    super(entries.sort( (a, b) => {
      if(a[1]<b[1]){
        return 1
      } else if (a[1]>b[1]){
        return -1
      } else {
        //If values are tied, sort by key
        return (a[0].toLowerCase() > b[0].toLowerCase())
      }
    }));
  }

  //Map is shown as a rank in format of
  //
  //1. [clubName] [ScoreNumber] pts\n
  //#. [clubName2] [Score2Number] pts\n
  //#+k. [clubNamek] [ScorekNumber] pts\n
  //With #/#+k incrementing only if Score2Number of the row is a lesser
  //value than the preceding row's value of ScoreNumber.
  toString(){
    let array = Array.from(super.entries());
    if (!array.length > 0) return '';

    let lastScore = -1;
    let lastRank = 0;
    let str = ''
    let rank = 0;
    array.forEach( (entry) => {
      rank++
      const currRank = (lastScore == entry[1] ? lastRank : rank);
      lastScore = entry[1];
      str = str + currRank + '. '+ entry[0] + ', '+ lastScore +
      (lastScore == 1 ? ' pt' : ' pts') + '\n';
      lastRank = currRank;
    });
    return str;
  }
}

/*////////////////////// Test Code ////////////////////////////*/

//Given an input file and an output file that holds the expected result
//tests to make sure that the application gives back a result from the
//input that matches the expected output
const testCalc = function(test, input, expectedOutput){
  calcLeagueScores(input, (output)=>{
    fs.writeFileSync('test_'+input,output,'utf-8');
    const found = fs.readFileSync('test_'+input);
    const expected = fs.readFileSync(expectedOutput);

    //\r filter is to assist with test output files constructed manually with
    //windows machines i.e my laptop
    runTest(test, found.toString(), expected.toString().replace(/\r/g,''));
    fs.unlinkSync('test_'+input);
  })
}

//Given a line such as '1. FFC Turbine Potsdam 4', test to check if the
//method prepareClubName() can accurately parse out the score number and
//return the correct name
const testPrepare = function(test, line, name){
  const scoreArray = line.split(' ')
  const result = prepareClubName(scoreArray)[0]

  runTest(test, result, name);
}

//Given 2 score numbers, tests that the method getModifiers() can correctly
//ascertain a tuple [0,0] representing how many ranking points each team
//should receive
const testModifiers = function(test, scoreNum1, scoreNum2, expectedModifiers){
  const modifiers = getModifiers(scoreNum1, scoreNum2);
  runTest(test, modifiers.toString(), expectedModifiers.toString());
}

//Tests to make sure after applying the modifier to a map made from entries
//like [[Team1, 0], [Team2, 1]] that the specified clubName has the correct
//score and that only the specified club's ranking points were affected by
//checking with the expectedScore(same format as entries).
const testUpdate = function(test, clubName, modifier, entries,
  expectedScore){
  var rankingMap = new Map(entries);
  updateRanking(clubName, modifier, rankingMap);
  runTest(test, Array.from(rankingMap.entries()).toString(),
  expectedScore.toString());
}

//Given a map of entries [[Team1, 0],[Team2,3]], tests that the resulting
//map matches a sorted by values then keys map given through the expected
//parameter which takes the form of [[Team2,3],[Team1,0]]
const testSortedMap = function(test, entries, expected){
  var sortedMap = new SortedRankMap(entries);
  runTest(test, Array.from(sortedMap.entries()).toString(),
  expected.toString());
}

//Given a map of entries [[Team1, 0],[Team2,3]], tests that the toString
//method of the map follows the rules of the ranking table  with \n being
//used for linebreaks by checking linebreaks by checking with the
//expected parameter which should be in the format of
//"1. Team2 , 3 pts\n2. Team1, 0 pts"
const testSortedMapToString = function(test, entries, expected){
  var sortedMap = new SortedRankMap(entries);
  runTest(test, sortedMap.toString(), expected);
}

const runTest = function (testName, found, expected){
  console.log('\n'+ testName)
  try{
      assert.equal(found,expected);
      console.log('Passed');
  } catch(error) {
    console.error(error)
    console.error('Failed');
    console.error('Found:')
    console.error(found);
    console.error('Expected:');
    console.error(expected);
  }
}

const testEverything = function(){
  //testCalcs is run asynchronously
  testCalc('Calc: example','sample-input.txt', 'expected-output.txt');
  testCalc('Calc: all-tied', 'tied-input.txt', 'tied-output.txt');
  testCalc('Calc: empty', 'empty-input.txt', 'empty-output.txt');
  testCalc('Calc: two-lead', 'two-lead-input.txt', 'two-lead-output.txt');

  //Tests the prepareClubName method
  testPrepare('Prepare: real-team',
    '1. FFC Turbine Potsdam 4', '1. FFC Turbine Potsdam');
  testPrepare('Prepare: number-name',
    '1 2 3 4 Kids \'R Awesome 5', '1 2 3 4 Kids \'R Awesome');
  testPrepare(
    'Prepare: spaceTASTIC',
    '    j ump ing jac ks     4', '    j ump ing jac ks    ');
  testPrepare('Prepare: shortName', 'a 1', 'a');
  testPrepare('Prepare: empty', '', '');
  testPrepare('Prepare: negative', "Team -2negative- -1", "Team -2negative-");

  //Tests the getModifiers method
  testModifiers('Modifer: Team 1 Win', 1, 0, [3,0]);
  testModifiers('Modifier: Team 2 Win', 0, 1, [0,3]);
  testModifiers('Modifier: Team Tied', 1, 1, [1,1]);
  testModifiers('Modifer: Team Tied 0', 0, 0, [1,1]);
  testModifiers('Modifer: negative', 0, -1, [3,0]);
  testModifiers('Modifier: empty',null,null,[1,1]);

  //Tests the updateRanking method
  testUpdate('Update: Add3Modifier', 'a', 3 ,
    [['a', 2], ['b', 1], ['c', 4]],
    [['a', 5], ['b', 1], ['c', 4]]
  );
  testUpdate('Update: Add3ModifierNew', 'a', 3,
    [['b', 1], ['c', 4]],
    [['b', 1], ['c', 4], ['a', 3]]
  );
  testUpdate('Update: Add0ModifierNew', 'a', 0,
    [['b', 1], ['c', 4]],
    [['b', 1], ['c', 4], ['a', 0]]
  );
  testUpdate('Update: AddModifierMiddle', 'b', 3,
    [['a', 2], ['b', 1], ['c', 4]],
    [['a', 2], ['b', 4], ['c', 4]]
  );
  testUpdate('Update:empty','',null,[],[]);

  //Tests the sort constructor of the SortedRankMap class
  testSortedMap('Sort: reversedMap',
    [['a', 0], ['b', 1], ['c', 2]],
    [['c', 2], ['b', 1], ['a', 0]]
  );
  testSortedMap('Sort: jumbledMap',
    [['a', 1], ['b', 0], ['c', 2]],
    [['c', 2], ['a', 1], ['b', 0]]
  );
  testSortedMap('Sort: alphabetical',
    [['c', 0], ['a', 0], ['b', 0]],
    [['a', 0], ['b', 0], ['c', 0]]
  );
  testSortedMap('Sort: alphabeticalMixCaps',
    [['B', 0], ['c', 0], ['A', 0]],
    [['A', 0], ['B', 0], ['c', 0]]
  );
  testSortedMap('Sort: alphabeticalMixCapsNums',
    [['1', 0], ['c', 0], ['A', 0]],
    [['1', 0], ['A', 0], ['c', 0]]
  );
  testSortedMap('Sort: alphabeticalMixCapsSpecial',
    [['¥', 0], ['c', 0], ['A', 0]],
    [['A', 0], ['c', 0], ['¥', 0]]
  );
  testSortedMap('Sort: empty', [], []);

  //Tests the toString method of the SortedRankMap class
  testSortedMapToString('Sort: alreadySorted',
    [['a', 3], ['b', 2], ['c', 0]],
    '1. a, 3 pts\n2. b, 2 pts\n3. c, 0 pts\n'
  );
  testSortedMapToString('Sort: allTied',
    [['a', 0], ['b', 0], ['c', 0]],
    '1. a, 0 pts\n1. b, 0 pts\n1. c, 0 pts\n'
  );
  testSortedMapToString('Sort: unSortedTied',
    [['b', 0], ['c', 0], ['a', 0]],
    '1. a, 0 pts\n1. b, 0 pts\n1. c, 0 pts\n'
  );
  testSortedMapToString('Sort: unSortedOneLead',
    [['b', 0], ['c', 0], ['a', 3]],
    '1. a, 3 pts\n2. b, 0 pts\n2. c, 0 pts\n'
  );
  testSortedMapToString('Sort: tiedLead',
    [['b', 3], ['c', 0], ['a', 3]],
    '1. a, 3 pts\n1. b, 3 pts\n3. c, 0 pts\n'
  );
  testSortedMapToString('Sort: empty',[],'');
}

module.exports = {
  calcLeagueScores,
  testEverything
};
