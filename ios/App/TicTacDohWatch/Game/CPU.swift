import Foundation

func solveBoard(_ boardState: BoardNode, turn: Player, player: Player) -> BoardNode {
    if let winner = determineWinner(boardState.board) {
        var solved = boardState
        solved.victoryState = winner.player == player ? .win : .lose
        solved.children = []
        return solved
    }

    var possibleMoves: [BoardNode] = []
    for (index, tile) in boardState.board.enumerated() where tile == .empty {
        var nextBoard = boardState.board
        nextBoard[index] = turn.mark
        possibleMoves.append(
            BoardNode(
                board: nextBoard,
                player: turn,
                move: index,
                victoryState: .none,
                children: []
            )
        )
    }

    if possibleMoves.isEmpty {
        var drawn = boardState
        drawn.victoryState = .draw
        drawn.children = []
        return drawn
    }

    let nextTurn = turn.opponent
    var solved = boardState
    solved.victoryState = .none
    solved.children = possibleMoves.map { solveBoard($0, turn: nextTurn, player: player) }
    return solved
}

private func randomItem(_ values: [Int], rng: RandomSource) -> Int? {
    guard !values.isEmpty else { return nil }
    return values[rng.nextIndex(upperBound: values.count)]
}

private func pickMove(for state: Victory, children: [BoardNode], rng: RandomSource) -> Int? {
    let moves = children.filter { $0.victoryState == state }.map(\.move)
    return randomItem(moves, rng: rng)
}

func pickRandomEmptyTile(_ board: [Tile], rng: RandomSource) -> Int? {
    let emptyTiles = board.enumerated().compactMap { index, tile in
        tile == .empty ? index : nil
    }
    return randomItem(emptyTiles, rng: rng)
}

/// Same order as `src/services/game.ts` `pickMove`: random opening, immediate
/// win, block, random continuation. The block step returns the opponent's
/// winning tile index (that is the square to take), which is what the
/// TypeScript reducer pushes.
func pickMove(_ board: BoardNode, rng: RandomSource) -> Int? {
    if board.victoryState != .none {
        return nil
    }

    if !board.board.contains(where: { $0 != .empty }) {
        return pickRandomEmptyTile(board.board, rng: rng)
    }

    let solved = solveBoard(board, turn: board.player, player: board.player)
    if let winningMove = pickMove(for: .win, children: solved.children, rng: rng) {
        return winningMove
    }

    var blockIndices: [Int] = []
    for child in solved.children {
        if let move = pickMove(for: .lose, children: child.children, rng: rng) {
            blockIndices.append(move)
        }
    }
    if let blockingMove = randomItem(blockIndices, rng: rng) {
        return blockingMove
    }

    let possibleMoves = solved.children.filter { $0.victoryState == .none }.map(\.move)
    return randomItem(possibleMoves, rng: rng)
}

func pickNextMove(board: [Tile], player: Player, rng: RandomSource) -> Int? {
    let node = BoardNode(board: board, player: player, move: 0, victoryState: .none, children: [])
    if let move = pickMove(node, rng: rng) {
        return move
    }
    return pickRandomEmptyTile(board, rng: rng)
}

func immediateWinMoves(board: [Tile], player: Player) -> [Int] {
    let solved = solveBoard(
        BoardNode(board: board, player: player, move: 0, victoryState: .none, children: []),
        turn: player,
        player: player
    )
    return uniqueMoves(solved.children.filter { $0.victoryState == .win }.map(\.move))
}

func blockMoves(board: [Tile], player: Player) -> [Int] {
    let solved = solveBoard(
        BoardNode(board: board, player: player, move: 0, victoryState: .none, children: []),
        turn: player,
        player: player
    )
    var moves: [Int] = []
    for child in solved.children {
        moves.append(contentsOf: child.children.filter { $0.victoryState == .lose }.map(\.move))
    }
    return uniqueMoves(moves)
}

private func uniqueMoves(_ values: [Int]) -> [Int] {
    var seen: [Int] = []
    for value in values where !seen.contains(value) {
        seen.append(value)
    }
    return seen
}
