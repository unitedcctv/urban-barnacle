#!/bin/bash
(crontab -l; for u in $(cut -f1 -d: /etc/passwd); do crontab -l -u $u 2>/dev/null; done) | grep -i curl