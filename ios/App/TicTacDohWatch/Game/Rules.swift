import Foundation

let winningLines: [[Int]] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]

func determineWinner(_ board: [Tile]) -> Winner? {
    var xCount = 0
    var oCount = 0
    for tile in board {
        if tile == .x {
            xCount += 1
        } else if tile == .o {
            oCount += 1
        }
    }
    if xCount < 3 && oCount < 3 {
        return nil
    }

    for line in winningLines {
        let a = line[0]
        let b = line[1]
        let c = line[2]
        if board[a] != .empty && board[a] == board[b] && board[a] == board[c] {
            let player: Player = board[a] == .x ? .x : .o
            return Winner(player: player, line: line)
        }
    }
    return nil
}

func isBoardDraw(_ board: [Tile]) -> Bool {
    determineWinner(board) == nil && !board.contains(.empty)
}
