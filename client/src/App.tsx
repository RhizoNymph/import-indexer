import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D, ForceGraphVR, ForceGraph3D } from 'react-force-graph';
import * as d3 from 'd3';
import { scaleSequential } from 'd3-scale';
import * as THREE from 'three';

import { ImportStructure, SupportedLanguage } from './types/common';

import * as graphutils from './utils/graph';
import * as nodeutils from './utils/node';

import { GraphID, Graph } from './types/graph';
import { NodeID, NodeProps, Node, ChildNode, ParentNode, CompositeNode, NodeType } from './types/node';
import { Edge, WeightedEdge } from './types/edge';

import './App.css';

const initialNodes: Node<any>[] = [];
const initialEdges: Edge[] = [];
const initialConnections = {};

function App() {
  const [repoUrl, setRepoUrl] = useState('paradigmxyz/cryo');
  const [branch, setBranch] = useState('main');
  const [nodes, setNodes] = useState<Node<any>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [visibleNodes, setVisibleNodes] = useState<Node<any>[]>(nodes);
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>(edges);
  const [graph, setGraph] = useState<Graph>({ id: "0", nodes: nodes, links: edges, groups: []})
  const [language, setLanguage] = useState(SupportedLanguage.Rust);
  const [viewMode, setViewMode] = useState('3D');
  const [nodeConnections, setNodeConnections] = useState<object>(initialConnections);
  const fgRef = useRef();

  const fetchRepoFiles = async () => {
    try {
      const response = await fetch(`http://localhost:2999/repoImports/${repoUrl.split('/')[0]}/${repoUrl.split('/')[1]}/${branch}/${language}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ImportStructure = await response.json();

      const transformedData: Graph = graphutils.fromImportStructure(data);

      setNodes(transformedData.nodes);
      setEdges(transformedData.links);
      setGraph(transformedData);
      setVisibleNodes(transformedData.nodes);
      setVisibleEdges(transformedData.links);     
      var newConnections = {}
      transformedData.links.forEach(edge => {        
        newConnections[edge.source] = (newConnections[edge.source] || 0) + 1;
        newConnections[edge.target] = (newConnections[edge.target] || 0) + 1;
      }); 
      setNodeConnections(newConnections);
    } catch (error) {
      console.error('An error occurred while fetching the repo files:', error);
    }
  };

  const collapseAllButRoot = useCallback(() => {
    const collapsedGraph = graphutils.collapseAllButRoot(graph);
    setNodes(collapsedGraph.nodes);
    setEdges(collapsedGraph.links); 
    setGraph(collapsedGraph);
    setVisibleNodes(collapsedGraph.nodes);
    setVisibleEdges(collapsedGraph.links);
  }, [graph]);

  const handleNodeClick = useCallback((link: any) => {
    console.log("clicked node: ".concat(JSON.stringify(link)));
  }, []);

  const colorScale = scaleSequential(d3.interpolateWarm)
  .domain([0, d3.max(nodes.filter(d => d.depth !== undefined), d => d.depth) || 0]);

  const getNodeColor = (node: Node<any>) => {
    if (node.depth === 0) {
      return "#ffffff"
    } if (node.type === NodeType.File) {
      return '#f1e132';
    } else if (node.type === NodeType.Import) {
      return '#00ff00';
    } else {
      return colorScale(node.depth*0.5);
    }
  }
  
  return (
    <div className="App">
      <div className="sidebar" style={{ position: 'fixed', width: '20%', height: '100vh' }}>
        <header className="App-header">
          <input type="text" placeholder="Repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
          <input type="text" placeholder="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />        
          <select value={language} onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}>
            {Object.values(SupportedLanguage).map((lang, index) => (
              <option key={index} value={lang}>{lang}</option>
            ))}
          </select>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}> 
            <option value="2D">2D</option>
            <option value="3D">3D</option> // Added 3D option
            <option value="VR">VR</option>
          </select>
          <button onClick={fetchRepoFiles}>Fetch Repo Files</button>
          <button onClick={collapseAllButRoot}>Collapse All But Root</button>          
        </header>
      </div>
      <div className="force-graph-container" style={{ marginLeft: '20%' }}>
        {viewMode === '2D' ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={{
              "nodes": visibleNodes,
              "links": visibleEdges
            }}
            nodeAutoColorBy="group"
            linkDirectionalParticles="value"
            backgroundColor="#000000"
            linkColor={() => 'white'}
            nodeLabel={node => node.name}
            onNodeClick={handleNodeClick}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const size = Math.max(nodeConnections[node.id]*0.25+4, 4);
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = getNodeColor(node);
              ctx.fill();
              ctx.strokeStyle = 'black'; // Set stroke color
              ctx.lineWidth = 2; // Set stroke width
              ctx.stroke(); // Apply stroke
            }}
            nodeRelSize={10}
          />
        ) : viewMode === '3D' ? ( // Added 3D view option
          <ForceGraph3D
            ref={fgRef}
            graphData={{
              "nodes": visibleNodes,
              "links": visibleEdges
            }}
            nodeAutoColorBy="group"
            linkDirectionalParticles="value"
            backgroundColor="#000000"
            linkColor={() => 'white'}
            nodeLabel={node => node.name}
            onNodeClick={handleNodeClick}
            nodeThreeObject={(node) => {
              const size = Math.max(nodeConnections[node.id]*0.25+4, 4);
              const nodeGeometry = new THREE.SphereGeometry(size, 32, 32);
              const nodeMaterial = new THREE.MeshBasicMaterial({ color: getNodeColor(node) });
              const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
              const outlineGeometry = new THREE.SphereGeometry(size + 1, 32, 32); // Slightly larger size
              const outlineMaterial = new THREE.MeshBasicMaterial({ color: 'black', side: THREE.BackSide }); // Black color
              const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
            
              const group = new THREE.Group();
              group.add(nodeMesh);
              group.add(outlineMesh);
            
              return group;
            }}
          />
        ) : (
          <ForceGraphVR
            ref={fgRef}
            graphData={{
              "nodes": visibleNodes,
              "links": visibleEdges
            }}
            nodeAutoColorBy="group"
            linkDirectionalParticles="value"            
            linkColor={() => 'white'}
            nodeLabel={node => node.name}
            onNodeClick={handleNodeClick}     
            nodeThreeObject={(node) => {
              const size = Math.max(nodeConnections[node.id]*0.25+4, 4);
              const nodeGeometry = new THREE.SphereGeometry(size, 32, 32);
              const nodeMaterial = new THREE.MeshBasicMaterial({ color: getNodeColor(node) });
              const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
              const outlineGeometry = new THREE.SphereGeometry(size + 1, 32, 32); // Slightly larger size
              const outlineMaterial = new THREE.MeshBasicMaterial({ color: 'black', side: THREE.BackSide }); // Black color
              const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
            
              const group = new THREE.Group();
              group.add(nodeMesh);
              group.add(outlineMesh);
            
              return group;
            }}      
          />
        )}
      </div>
       
    </div>
  );
}

export default App;





