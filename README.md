# import-indexer
Use react-force-graph to visualize repo directory/file structures and the imports each file makes. (Rust only atm)

This is my attempt to create something that can construct automated import graphs of complex codebases
in a way enables better visualization than traditional diagramming tools and unlocks interactivity. 



This began as a way to get familiar with open source codebases that one would like to contribute to, and
ultimately evolved into a way for me to procrastinate contributing to the repos that I wanted to use it
to understand better.


Before I continue, let's look at some examples.

![cryo](https://github.com/QuantNymph/import-indexer/assets/82485126/4a082ade-3842-4807-a038-e20194c298f7)

![reth](https://github.com/QuantNymph/import-indexer/assets/82485126/b94c020c-4eee-477f-855a-7e595c6682fb)

Now that I have your attention, along the way I learned so much about this kind of structure that I ended up further nerdsniped by using what I learned here to start work on a generalized knowledge graph with this structure. This will later be integrated into that knowledge base with the ability to import a repo as a base graph to work from. I dream of being able to work on codebases by altering network structures, but more importantly I dream of grasping the incredible breadth and depth of knowledge avaialble to use these days.



I digress, I hope someone out there finds this useful. I put it out before integrating into my knowledge graph application in hopes that someone will. There are problems with it. It only works for Rust atm and it creates new nodes for super:: and crate:: imports but I'll work those out when I get around to coming back to this for the integration (or maybe someone else will?). I hope it's worth the wait and that some people who check this out stick around for it.


Actual Instructions (*gasp*)


You'll need to copy server/src/.envsample to server/src/.env and put in your Github personal access token.



To run this, have docker installed and type 'make' in the root directory. It'll take care of everything for you. Just navigate to localhost:2998 in your browser, put a (Rust) repo in, and click the button.
