import { loadUser } from "../utils/session";
import {
  renderUserMainMenu,
  renderAdminMainMenu,
} from "./techsupport/mainMenu";
import {
  renderUserTicketsList,
  renderAllTicketsList,
} from "./techsupport/ticketsList";
import {
  renderUserTicketDetail,
  renderAdminTicketDetail,
} from "./techsupport/ticketDetail";
import { renderCreateTicketForm } from "./techsupport/createTicketForm";
import { renderStatistics } from "./techsupport/statistics";
import "../static/css/techsupport.css";

export async function renderTechSupportPage(): Promise<void> {
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  const page = document.createElement("div");
  page.className = "page";
  app.appendChild(page);

  const user = loadUser();

  const closeIframe = () => {
    window.parent.postMessage("close-support-iframe", "*");
  };

  const navCallbacks = {
    toUserMenu: () => renderUserMainMenu(page, navCallbacks),
    toAdminMenu: () => renderAdminMainMenu(page, navCallbacks),
    toCreateTicket: () => renderCreateTicketForm(page, user, navCallbacks),
    toUserTickets: () => renderUserTicketsList(page, navCallbacks),
    toAllTickets: () => renderAllTicketsList(page, navCallbacks),
    toUserTicketDetail: (ticketId: number) =>
      renderUserTicketDetail(page, ticketId, navCallbacks),
    toAdminTicketDetail: (ticketId: number) =>
      renderAdminTicketDetail(page, ticketId, navCallbacks),
    toStatistics: () => renderStatistics(page, navCallbacks),
    close: closeIframe,
  };

  if (user && user.is_admin) {
    renderAdminMainMenu(page, navCallbacks);
  } else if (user) {
    renderUserMainMenu(page, navCallbacks);
  } else {
    renderCreateTicketForm(page, null, navCallbacks);
  }
}
