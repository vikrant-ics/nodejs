FROM registry.redhat.io/rhel8/nodejs-16

USER root 

# Install SSH server and utilities
RUN yum update -y && \
    yum install -y openssh-server && \
    yum clean all

RUN echo 'root:C0mm0n#112233' | chpasswd

RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    ssh-keygen -A

# Expose SSH port
EXPOSE 22

ENV APP_ROOT=/opt/app-root

WORKDIR $APP_ROOT

COPY app.js .
COPY package.json .

RUN npm install

EXPOSE 8080

CMD ["node", "app.js", "/usr/sbin/sshd", "-D"]
