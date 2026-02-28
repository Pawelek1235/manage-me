import { ProjectService } from "./services/ProjectService";

const service = new ProjectService();

service.create({
  id: crypto.randomUUID(),
  name: "Test Project",
  description: "Opis testowy"
});

console.log(service.getAll());