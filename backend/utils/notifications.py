
import logging
import requests
from django.conf import settings
from system_settings.models import SystemSetting

logger = logging.getLogger(__name__)

def send_wecom_notification(user, action_text, target_url=None):
    """
    Sends a notification to WeCom via Webhook.
    
    Format:
    [测试用例平台]公告：{user}用户-{action_text}
    
    If target_url is provided, action_text will be a link.
    """
    try:
        setting = SystemSetting.objects.get(key='wecom_webhook')
        webhook_url = setting.value
        if not webhook_url:
            return
    except SystemSetting.DoesNotExist:
        return
    except Exception as e:
        logger.error(f"Error getting wecom_webhook setting: {e}")
        return

    # Use first_name if available, else username
    username = user.first_name if user.first_name else user.username
    user_display = f"{username}用户"
    
    # Clean up action_text to remove newlines or excessive whitespace if any
    action_text = " ".join(action_text.split())
    
    if target_url:
        content_text = f"[{action_text}]({target_url})"
    else:
        content_text = action_text
        
    markdown_content = f"[测试用例平台]公告：{user_display}-{content_text}"
    
    payload = {
        "msgtype": "markdown",
        "markdown": {
            "content": markdown_content
        }
    }
    
    try:
        # Send async or with short timeout to avoid blocking main thread too long
        requests.post(webhook_url, json=payload, timeout=2)
    except Exception as e:
        logger.error(f"Failed to send WeCom notification: {e}")
