# Tic Tac DOH!

Basic tic-tac-toe game with a simple AI.

## Game Solver

```
solveBoard:
  given the board,
    if player wins,
      mark victory condition as WIN
      return

    if opponent wins,
      mark victory condition as LOSE
      return

    generate and save list of possible moves (
      generate a new board state for all possible places the player can move
    )

    if no possible moves,
      mark victory condition as DRAW
      return

    for each possible move,
      mark victory condition as NONE
      for each open space on board,
        place opponent
        solveBoard
```
