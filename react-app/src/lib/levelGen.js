// Level generation and utilities (copied from legacy)
export function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

export function getReachableCells(grid, sx, sy){
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const q = [];
  const cells = [];
  if(sx < 0 || sy < 0 || sx >= cols || sy >= rows) return cells;
  if(grid[sy][sx] === 1) return cells;
  visited[sy][sx] = true;
  q.push({x:sx,y:sy});
  cells.push({x:sx,y:sy});
  while(q.length){
    const {x,y} = q.shift();
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    for(const d of dirs){
      const nx = x + d.dx, ny = y + d.dy;
      if(nx>=0 && nx<cols && ny>=0 && ny<rows && !visited[ny][nx] && grid[ny][nx]===0){
        visited[ny][nx] = true;
        q.push({x:nx,y:ny});
        cells.push({x:nx,y:ny});
      }
    }
  }
  return cells;
}

export function generateMaze(cellCols, cellRows){
  const w = cellCols*2 + 1;
  const h = cellRows*2 + 1;
  const maze = Array.from({length:h},()=>Array(w).fill(1));

  const startX = 1, startY = 1;
  maze[startY][startX] = 0;
  const stack = [{x:startX,y:startY}];
  const dirs = [{dx:0,dy:-2},{dx:2,dy:0},{dx:0,dy:2},{dx:-2,dy:0}];

  while(stack.length){
    const cur = stack[stack.length-1];
    const x = cur.x, y = cur.y;
    const neighbors = [];
    for(const d of dirs){
      const nx = x + d.dx, ny = y + d.dy;
      if(nx>0 && nx<w && ny>0 && ny<h && maze[ny][nx] === 1){
        neighbors.push({nx, ny, betweenX: x + d.dx/2, betweenY: y + d.dy/2});
      }
    }
    if(neighbors.length === 0){
      stack.pop();
    } else {
      const n = neighbors[Math.floor(Math.random()*neighbors.length)];
      // carve between and neighbor
      maze[n.betweenY][n.betweenX] = 0;
      maze[n.ny][n.nx] = 0;
      stack.push({x:n.nx, y:n.ny});
    }
  }

  return maze;
}

export function openUpMaze(maze, openness){
  if(openness <= 0) return maze;
  const rows = maze.length;
  const cols = maze[0].length;
  const walls = [];
  for(let y=1;y<rows-1;y++){
    for(let x=1;x<cols-1;x++){
      if(maze[y][x] === 1) walls.push({x,y});
    }
  }
  const removes = Math.floor(walls.length * openness);
  shuffle(walls);
  let removed = 0;
  for(const w of walls){
    if(removed >= removes) break;
    maze[w.y][w.x] = 0;
    const reachable = getReachableCells(maze, 1, 1);
    if(reachable.length < 3) {
      maze[w.y][w.x] = 1;
    } else {
      removed++;
    }
  }
  return maze;
}

export function getTraversalPath(grid, sx, sy){
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const path = [];
  function neighbors(x,y){
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    const out = [];
    for(const d of dirs){
      const nx = x + d.dx, ny = y + d.dy;
      if(nx>=0 && nx<cols && ny>=0 && ny<rows && grid[ny][nx]===0) out.push({x:nx,y:ny});
    }
    return out;
  }

  const stack = [{x:sx,y:sy, iter:0}];
  visited[sy][sx] = true;
  path.push({x:sx,y:sy});
  while(stack.length){
    const top = stack[stack.length-1];
    const nb = neighbors(top.x, top.y).filter(n => !visited[n.y][n.x]);
    if(nb.length === 0){
      stack.pop();
    } else {
      const n = nb[Math.floor(Math.random()*nb.length)];
      visited[n.y][n.x] = true;
      stack.push({x:n.x,y:n.y,iter:0});
      path.push({x:n.x,y:n.y});
    }
  }
  return path;
}
