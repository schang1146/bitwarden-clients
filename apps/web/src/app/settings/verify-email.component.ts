import { Component, EventEmitter, Output } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { TokenService } from "@bitwarden/common/abstractions/token.service";

@Component({
  selector: "app-verify-email",
  templateUrl: "verify-email.component.html",
})
export class VerifyEmailComponent {
  actionPromise: Promise<unknown>;

  @Output() verifiedEmitter = new EventEmitter<boolean>();

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private tokenService: TokenService
  ) {}

  async send() {
    if (this.actionPromise != null) {
      return;
    }
    await this.apiService.refreshIdentityToken();
    if (await this.tokenService.getEmailVerified()) {
      this.verifiedEmitter.emit(true);
      this.platformUtilsService.showToast("success", null, this.i18nService.t("emailVerified"));
      return;
    }

    try {
      this.actionPromise = this.apiService.postAccountVerifyEmail();
      await this.actionPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("checkInboxForVerification")
      );
    } catch (e) {
      this.logService.error(e);
    }
    this.actionPromise = null;
  }
}
