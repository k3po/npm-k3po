# k3po-exec.js

Starts K3PO driver via node

To Start
```bash
node k3po-exec.js --pom ./test/pom.xml --log ./builds/k3po-test.log --pidFile ./builds/k3po-test.pid start
```

To Stop
```
node k3po-exec.js stop --pidFile ./builds/k3po-test.pid
```
